import { Track, artistNames, LibraryManager } from './library';
import EventEmitter from './common/events';
import { PlayQueue, QueueChangeEvent } from './queues/play-queue';

import Hls from 'hls.js';
import { NotificationService, NotificationType } from './common/notifications';
import { PlaybackState } from './api/interface';

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

declare global {
    class MediaSession {
        metadata: MediaMetadata;
        playbackState: 'none' | 'paused' | 'playing';
        setActionHandler(evt: string, handler: () => void): void;
    }
    interface Navigator {
        mediaSession?: MediaSession;
    }
    class MediaMetadata {
        constructor(opts: { title?: string; artist?: string; album?: string });
    }
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

export class AudioPlayer {
    useHls: boolean;
    playQueue: PlayQueue;
    playing: boolean;
    muted: boolean;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    volume: number;

    public playbackEvent: EventEmitter<PlaybackEvent> = new EventEmitter();
    public onQueueChange: EventEmitter<QueueChangeEvent> = new EventEmitter();

    private shuffleOrder: Array<number> = [];
    private hls: Hls | null = null;
    private playbackStartDate: Date = new Date();
    private lastProgressReportTime: Date = new Date();

    private playQueueUpdateHandler: number;
    private element: HTMLAudioElement;
    static instance: AudioPlayer;

    constructor(private readonly libraryManager: LibraryManager) {
        this.element = document.createElement('audio');
        this.playQueue = new PlayQueue('Default');
        this.playQueueUpdateHandler = this.listenToQueueUpdates(this.playQueue);
        this.useHls = false;
        this.playing = false;
        this.repeatMode = RepeatMode.Off;
        this.shuffleMode = ShuffleMode.Off;
        this.volume = 1;
        this.muted = false;
        this.element.addEventListener('ended', () => {
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this.libraryManager.reportPlaybackFinished(
                    activeTrack,
                    this.playbackState()
                );
            }
            this._handleTrackEnd();
        });
        this.element.addEventListener('timeupdate', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Time,
                time: this.element.currentTime,
                state: this.playbackState(),
            });
            const now = new Date();
            const activeTrack = this.activeTrack();
            if (
                now.getTime() - this.lastProgressReportTime.getTime() > 10000 &&
                activeTrack
            ) {
                this.libraryManager.reportPlaybackProgress(
                    activeTrack,
                    this.playbackState()
                );
                this.lastProgressReportTime = now;
            }
        });
        this.element.addEventListener('play', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Resume,
                state: this.playbackState(),
            });
        });
        this.element.addEventListener('pause', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Pause,
                state: this.playbackState(),
            });
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this.libraryManager.reportPaused(
                    activeTrack,
                    this.playbackState()
                );
            }
        });
        this.element.addEventListener('error', () => {
            console.error('Playback error: ', this.element.error);
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
        return playQueue.onChange.on(() => this._shuffle());
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
            startTime: this.playbackStartDate,
            progressMs: this.element.currentTime * 1000,
        };
    }

    getQueue(): PlayQueue {
        return this.playQueue;
    }

    setQueue(playQueue: PlayQueue): void {
        this.playQueue.onChange.off(this.playQueueUpdateHandler);
        this.playQueue = playQueue;
        this.playQueueUpdateHandler = this.listenToQueueUpdates(playQueue);
        this.onQueueChange.trigger({
            newQueue: playQueue,
        });
    }

    play(index: number): void {
        const track = this.playQueue.getTrack(index);
        if (track) {
            this.playQueue.index = index;
            this.playTrack(track, index);
        }
    }

    setTime(time: number): void {
        if (this.element) {
            this.element.currentTime = time;
        }
    }

    _startPlayback(track: Track, index: number): void {
        this.element.play();
        this.playing = true;
        const artist = artistNames(track);
        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.name,
                album: track.album.name,
                artist,
            });
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
        if (this.hls) {
            this.hls.destroy();
        }
        const playbackUrl = this.libraryManager.getPlaybackUrl(
            track,
            new Date().getTime().toString()
        );
        this.hls = new Hls({
            manifestLoadingTimeOut: 20000,
            xhrSetup: function (xhr) {
                xhr.withCredentials = true;
            },
        });
        this.hls.loadSource(playbackUrl);
        this.hls.attachMedia(this.element);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this._startPlayback(track, index);
        });
        this.hls.on(Hls.Events.ERROR, (_evt, data) => {
            console.error('HLS error', data);
        });
    }

    _playNative(track: Track, index: number): void {
        const startDate = new Date();
        this.element.src = this.libraryManager.getPlaybackUrl(
            track,
            startDate.getTime().toString()
        );
        this.element.load();
        this.element
            .play()
            .then(() => {
                this.playbackStartDate = startDate;
                this._startPlayback(track, index);
                this.libraryManager.reportPlaybackStart(
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
                const shuffledTrackIndex = this.shuffleOrder[
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
                const shuffledTrackIndex = this.shuffleOrder[
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
            this.element.pause();
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
            await this.element.play();
            this.playing = true;
            this.libraryManager.reportResumed(
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
        this.element.pause();
        this.playing = false;
        if (activeTrack) {
            this.libraryManager.reportPaused(activeTrack, this.playbackState());
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
        if (this.element.paused) {
            this._resume();
        } else {
            this._pause();
        }
    }

    stop(): void {
        if (this.playing) {
            this.element.pause();
            this.playing = false;
            document.title = 'Preserve';
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
                state: this.playbackState(),
            });
            const activeTrack = this.activeTrack();
            if (activeTrack) {
                this.libraryManager.reportPlaybackFinished(
                    activeTrack,
                    this.playbackState()
                );
            }
        }
    }

    _shuffle(): void {
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
        this.shuffleOrder = shuffleOrder;
    }

    toggleShuffle(): ShuffleMode {
        this.shuffleMode =
            this.shuffleMode === ShuffleMode.Off
                ? ShuffleMode.Shuffle
                : ShuffleMode.Off;
        this._shuffle();
        if (this.shuffleMode === ShuffleMode.Shuffle) {
            this.playQueue.index = 0;
            const firstShuffledIndex = this.shuffleOrder[0];
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
        this.element.volume = this.volume = volume;
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this.libraryManager.reportVolumeChange(
                activeTrack,
                this.playbackState()
            );
        }
    }

    setRepeatMode(repeatMode: RepeatMode): void {
        this.repeatMode = repeatMode;
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this.libraryManager.reportRepeatChanged(
                activeTrack,
                this.playbackState()
            );
        }
    }

    setShuffleMode(shuffleMode: ShuffleMode): void {
        this.shuffleMode = shuffleMode;
        if (shuffleMode === ShuffleMode.Shuffle) {
            this._shuffle();
        }
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this.libraryManager.reportShuffleChanged(
                activeTrack,
                this.playbackState()
            );
        }
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.muted) {
            this.element.volume = 0;
        } else {
            this.element.volume = this.volume;
        }
        const activeTrack = this.activeTrack();
        if (activeTrack) {
            this.libraryManager.reportMutedToggled(
                activeTrack,
                this.playbackState()
            );
        }
        return this.muted;
    }
}
