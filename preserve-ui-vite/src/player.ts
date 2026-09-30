import { type Track, artistNames, LibraryManager } from './library';
import EventEmitter from './common/events';
import { PlayQueue, type QueueChangeEvent } from './queues/play-queue';

import Hls from 'hls.js';
import { NotificationService, NotificationType } from './common/notifications';
import { type PlaybackState } from './api/interface';

export enum PlaybackEventType {
    Play,
    Pause,
    Resume,
    Time,
    End,
}

interface PlayEvent {
    type: PlaybackEventType.Play;
    state: PlaybackState;
    track: Track;
    queueIndex: number;
}

interface PauseEvent {
    type: PlaybackEventType.Pause;
    state: PlaybackState;
}

interface ResumeEvent {
    type: PlaybackEventType.Resume;
    state: PlaybackState;
}

interface TimeEvent {
    type: PlaybackEventType.Time;
    state: PlaybackState;
    time: number;
}

interface EndEvent {
    type: PlaybackEventType.End;
    state: PlaybackState;
}

export enum RepeatMode {
    Off,
    Repeat,
    RepeatOne,
}

export enum ShuffleMode {
    Off,
    Shuffle,
}

export type PlaybackEvent =
    | PlayEvent
    | PauseEvent
    | ResumeEvent
    | EndEvent
    | TimeEvent;

export type HlsInterface = Pick<Hls, keyof Hls>;

export class AudioPlayer {
    useHls: boolean;
    playQueue: PlayQueue;
    playing: boolean;
    muted: boolean;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    volume: number;

    playbackEvent: EventEmitter<PlaybackEvent> = new EventEmitter();
    onQueueChange: EventEmitter<QueueChangeEvent> = new EventEmitter();

    _shuffleOrder: Array<number> = [];
    _hls: HlsInterface | null = null;
    _playbackStartDate: Date = new Date();
    _lastProgressReportTime: Date = new Date();

    _playQueueUpdateHandler: number;
    _element: HTMLAudioElement;
    static instance: AudioPlayer;

    constructor(public _libraryManager: LibraryManager) {
        this._element = document.createElement('audio');
        this.playQueue = new PlayQueue('Default');
        this._playQueueUpdateHandler = this.listenToQueueUpdates(this.playQueue);
        this.useHls = false;
        this.playing = false;
        this.repeatMode = RepeatMode.Off;
        this.shuffleMode = ShuffleMode.Off;
        this.volume = 1;
        this.muted = false;
        this._element.addEventListener('ended', () => {
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this._libraryManager.reportPlaybackFinished(
                    activeTrack,
                    this.playbackState()
                );
            }
            this._handleTrackEnd();
        });
        this._element.addEventListener('timeupdate', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Time,
                time: this._element.currentTime,
                state: this.playbackState(),
            });
            const now = new Date();
            const activeTrack = this.activeTrack();
            if (
                now.getTime() - this._lastProgressReportTime.getTime() > 10000 &&
                activeTrack
            ) {
                this._libraryManager.reportPlaybackProgress(
                    activeTrack,
                    this.playbackState()
                );
                this._lastProgressReportTime = now;
            }
        });
            this._element.addEventListener('play', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Resume,
                state: this.playbackState(),
            });
        });
        this._element.addEventListener('pause', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Pause,
                state: this.playbackState(),
            });
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this._libraryManager.reportPaused(
                    activeTrack,
                    this.playbackState()
                );
            }
        });
        this._element.addEventListener('error', () => {
            console.error('Playback error: ', this._element.error);
        });

        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('play', () => {
                this._resume();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                this._pause();
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.previousTrack();
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.nextTrack();
            });
        }
    }

    static getOrCreateInstance(libraryManager: LibraryManager): AudioPlayer {
        if (AudioPlayer.instance) {
            return AudioPlayer.instance;
        } else {
            const player = new AudioPlayer(libraryManager);
            AudioPlayer.instance = player;
            return player;
        }
    }

    listenToQueueUpdates(playQueue: PlayQueue): number {
        return playQueue.onChange.on(() => this.generateShuffleOrder());
    }

    activeTrack(): Track | null {
        return this.playQueue.activeTrack();
    }

    playbackState(): PlaybackState {
        return {
            trackId: this.activeTrack()?.id || null,
            trackServerId: this.activeTrack()?.serverId || null,
            repeatMode: this.repeatMode,
            shuffleMode: this.shuffleMode,
            volume: this.volume,
            muted: this.muted,
            paused: !this.playing,
            startTime: this._playbackStartDate,
            progressMs: this._element.currentTime * 1000,
        };
    }

    getQueue(): PlayQueue {
        return this.playQueue;
    }

    setQueue(playQueue: PlayQueue): void {
        this.playQueue.onChange.off(this._playQueueUpdateHandler);
        this.playQueue = playQueue;
        this._playQueueUpdateHandler = this.listenToQueueUpdates(playQueue);
        this.onQueueChange.trigger({
            newQueue: playQueue,
        });
        this.generateShuffleOrder();
    }

    play(index: number): void {
        const track = this.playQueue.getTrack(index);
        if (track) {
            this.playQueue.index = index;
            this.playTrack(track, index);
        }
    }

    setTime(time: number): void {
        if (this._element) {
            this._element.currentTime = time;
        }
    }

    _startPlayback(track: Track, index: number): void {
        this._element.play();
        this.playing = true;
        const artist = artistNames(track);
        if (navigator.mediaSession) {
            const trackArtUrl = this._libraryManager.getTrackArtUrl(track, 256);
            const albumArtArray = [];
            if (trackArtUrl) {
                albumArtArray.push({ src: trackArtUrl });
            }
            const metadata = new MediaMetadata({
                title: track.name,
                album: track.album.name,
                artist,
                artwork: albumArtArray,
            });
            navigator.mediaSession.metadata = metadata;
            navigator.mediaSession.playbackState = 'playing';
        }
        document.title = `${track.name} - ${artist} | Preserve`;
        this.playbackEvent.trigger({
            type: PlaybackEventType.Play,
            state: this.playbackState(),
            track,
            queueIndex: index,
        });
    }

    _playHls(track: Track, index: number): void {
        if (this._hls) {
            this._hls.destroy();
        }
        const playbackUrl = this._libraryManager.getPlaybackUrl(
            track,
            new Date().getTime().toString()
        );
        this._hls = new Hls({
            manifestLoadingTimeOut: 20000,
            xhrSetup: function (xhr) {
                xhr.withCredentials = true;
            },
        });
        this._hls.loadSource(playbackUrl);
        this._hls.attachMedia(this._element);
        this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this._startPlayback(track, index);
        });
        this._hls.on(Hls.Events.ERROR, (_evt, data) => {
            console.error('HLS error', data);
        });
    }

    _playNative(track: Track, index: number): void {
        const startDate = new Date();
        this._element.src = this._libraryManager.getPlaybackUrl(
            track,
            startDate.getTime().toString()
        );
        this._element.load();
        this._element
            .play()
            .then(() => {
                this._playbackStartDate = startDate;
                this._startPlayback(track, index);
                this._libraryManager.reportPlaybackStart(
                    track,
                    this.playbackState()
                );
            })
            .catch((e) => {
                NotificationService.notify(
                    `Error playing track: ${e}`,
                    NotificationType.Error,
                    30
                );
            });
    }

    playTrack(track: Track, index = -1): void {
        if (this.useHls) {
            this._playHls(track, index);
        } else {
            this._playNative(track, index);
        }
    }

    previousTrack(): void {
        const prevTrack = this.playQueue.previousTrack({
            repeatMode: this.repeatMode,
        });
        if (prevTrack) {
            if (this.shuffleMode === ShuffleMode.Shuffle) {
                const shuffledTrackIndex = this._shuffleOrder[
                    this.playQueue.index
                ];
                const shuffledTrack = this.playQueue.getTrack(
                    shuffledTrackIndex
                ) as Track;
                this.playTrack(shuffledTrack, shuffledTrackIndex);
            } else {
                this.playTrack(prevTrack, this.playQueue.index);
            }
        } else {
            this.playing = false;
            document.title = 'Preserve';
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
                state: this.playbackState(),
            });
        }
    }

    nextTrack(songEnded = false): void {
        const nextTrack = this.playQueue.nextTrack({
            repeatMode: this.repeatMode,
            songEnded: songEnded,
        });
        if (nextTrack) {
            if (this.shuffleMode === ShuffleMode.Shuffle) {
                const shuffledTrackIndex = this._shuffleOrder[
                    this.playQueue.index
                ];
                const shuffledTrack = this.playQueue.getTrack(
                    shuffledTrackIndex
                ) as Track;
                this.playTrack(shuffledTrack, shuffledTrackIndex);
            } else {
                this.playTrack(nextTrack, this.playQueue.index);
            }
        } else {
            this._element.pause();
            this.playing = false;
            document.title = 'Preserve';
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
                state: this.playbackState(),
            });
        }
    }

    _handleTrackEnd(): void {
        this.nextTrack(true);
    }

    async _resume(): Promise<void> {
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            await this._element.play();
            this.playing = true;
            this._libraryManager.reportResumed(
                activeTrack,
                this.playbackState()
            );
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
            }
            this.playbackEvent.trigger({
                type: PlaybackEventType.Resume,
                state: this.playbackState(),
            });
        }
    }

    _pause(): void {
        const activeTrack = this.activeTrack();
        this._element.pause();
        this.playing = false;
        if (activeTrack) {
            this._libraryManager.reportPaused(activeTrack, this.playbackState());
        }
        if (navigator.mediaSession) {
            navigator.mediaSession.playbackState = 'paused';
        }
        this.playbackEvent.trigger({
            type: PlaybackEventType.Pause,
            state: this.playbackState(),
        });
    }

    togglePlay(): void {
        if (this._element.paused) {
            this._resume();
        } else {
            this._pause();
        }
    }

    stop(): void {
        if (this.playing) {
            this._element.pause();
            this.playing = false;
            document.title = 'Preserve';
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
                state: this.playbackState(),
            });
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this._libraryManager.reportPlaybackFinished(
                    activeTrack,
                    this.playbackState()
                );
            }
        }
    }

    generateShuffleOrder(): void {
        const shuffleOrder = [];
        for (let i = 0; i < this.playQueue.size(); i++) {
            shuffleOrder.push(i);
        }
        // Fisher-Yates shuffle
        for (let i = shuffleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffleOrder[i], shuffleOrder[j]] = [
                shuffleOrder[j],
                shuffleOrder[i],
            ];
        }
        this._shuffleOrder = shuffleOrder;
    }

    toggleShuffle(): ShuffleMode {
        this.shuffleMode =
            this.shuffleMode === ShuffleMode.Off
                ? ShuffleMode.Shuffle
                : ShuffleMode.Off;
        this.generateShuffleOrder();
        if (this.shuffleMode === ShuffleMode.Shuffle) {
            this.playQueue.index = 0;
            const firstShuffledIndex = this._shuffleOrder[0];
            if (this.playQueue.size() > 0) {
                const shuffledTrack = this.playQueue.getTrack(
                    firstShuffledIndex
                ) as Track;
                this.playTrack(shuffledTrack, firstShuffledIndex);
            }
        }
        return this.shuffleMode;
    }

    nextRepeatMode(): RepeatMode {
        if (this.repeatMode === RepeatMode.Off) {
            this.repeatMode = RepeatMode.Repeat;
        } else if (this.repeatMode === RepeatMode.Repeat) {
            this.repeatMode = RepeatMode.RepeatOne;
        } else {
            this.repeatMode = RepeatMode.Off;
        }
        return this.repeatMode;
    }

    setVolume(volume: number): void {
        this.muted = false;
        this.volume = volume;
        this._element.volume = Math.pow(volume, 4);
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this._libraryManager.reportVolumeChange(
                activeTrack,
                this.playbackState()
            );
        }
    }

    setRepeatMode(repeatMode: RepeatMode): void {
        this.repeatMode = repeatMode;
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this._libraryManager.reportRepeatChanged(
                activeTrack,
                this.playbackState()
            );
        }
    }

    setShuffleMode(shuffleMode: ShuffleMode): void {
        this.shuffleMode = shuffleMode;
        if (shuffleMode === ShuffleMode.Shuffle) {
            this.generateShuffleOrder();
        }
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this._libraryManager.reportShuffleChanged(
                activeTrack,
                this.playbackState()
            );
        }
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.muted) {
            this._element.volume = 0;
        } else {
            this._element.volume = this.volume;
        }
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this._libraryManager.reportMutedToggled(
                activeTrack,
                this.playbackState()
            );
        }
        return this.muted;
    }
}
