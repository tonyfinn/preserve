import { Track, artistNames, LibraryManager } from './library';
import EventEmitter from './common/events';
import { PlayQueue, QueueChangeEvent } from './queues/play-queue';

import Hls from 'hls.js';
import { NotificationService, NotificationType } from './common/notifications';

export enum PlaybackEventType {
    Play,
    Pause,
    Resume,
    Time,
    End,
}

interface PlayBackEventBase {
    type: PlaybackEventType;
}

interface PlayEvent {
    type: PlaybackEventType.Play;
    track: Track;
    queueIndex: number;
}

interface PauseEvent {
    type: PlaybackEventType.Pause;
}

interface ResumeEvent {
    type: PlaybackEventType.Resume;
}

interface TimeEvent {
    type: PlaybackEventType.Time;
    time: number;
}

interface EndEvent {
    type: PlaybackEventType.End;
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
    element: HTMLAudioElement;
    hls: Hls | null;
    useHls: boolean;
    libraryManager: LibraryManager;
    playQueue: PlayQueue;
    playing: boolean;
    muted: boolean;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    shuffleOrder: Array<number>;
    playbackEvent: EventEmitter<PlaybackEvent>;
    onQueueChange: EventEmitter<QueueChangeEvent>;
    playQueueUpdateHandler: number;
    volume: number;
    static instance: AudioPlayer;

    constructor(libraryManager: LibraryManager) {
        this.element = document.createElement('audio');
        this.libraryManager = libraryManager;
        this.playQueue = new PlayQueue('Default');
        this.playQueueUpdateHandler = this.listenToQueueUpdates(this.playQueue);
        this.hls = null;
        this.useHls = false;
        this.playing = false;
        this.repeatMode = RepeatMode.Off;
        this.shuffleMode = ShuffleMode.Off;
        this.shuffleOrder = [];
        this.volume = 1;
        this.muted = false;
        this.playbackEvent = new EventEmitter();
        this.onQueueChange = new EventEmitter();
        this.element.addEventListener('ended', () => {
            this._handleTrackEnd();
        });
        this.element.addEventListener('timeupdate', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Time,
                time: this.element.currentTime,
            });
        });
        this.element.addEventListener('play', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Resume,
            });
        });
        this.element.addEventListener('pause', () => {
            this.playbackEvent.trigger({
                type: PlaybackEventType.Pause,
            });
        });
        this.element.addEventListener('error', () => {
            console.error('Playback error: ', this.element.error);
        });

        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('play', () => {
                this._play();
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
            track,
            queueIndex: index,
        });
    }

    _playHls(track: Track, index: number): void {
        if (this.hls) {
            this.hls.destroy();
        }
        const playbackUrl = this.libraryManager.getPlaybackUrl(track);
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
        this.element.src = this.libraryManager.getPlaybackUrl(track);
        this.element.load();
        this.element
            .play()
            .then(() => {
                this._startPlayback(track, index);
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
            });
        }
    }

    _handleTrackEnd(): void {
        this.nextTrack(true);
    }

    _play(): void {
        if (this.activeTrack()) {
            this.element.play();
            this.playing = true;
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
            }
            this.playbackEvent.trigger({
                type: PlaybackEventType.Resume,
            });
        }
    }

    _pause(): void {
        this.element.pause();
        this.playing = false;
        if (navigator.mediaSession) {
            navigator.mediaSession.playbackState = 'paused';
        }
        this.playbackEvent.trigger({
            type: PlaybackEventType.Pause,
        });
    }

    togglePlay(): void {
        if (this.element.paused) {
            this._play();
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
            });
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
        this.shuffleMode = this.shuffleMode === ShuffleMode.Off ? ShuffleMode.Shuffle : ShuffleMode.Off;
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
    }

    setRepeatMode(repeatMode: RepeatMode): void {
        this.repeatMode = repeatMode;
    }

    setShuffleMode(shuffleMode: ShuffleMode): void {
        this.shuffleMode = shuffleMode;
        if (shuffleMode === ShuffleMode.Shuffle) {
            this._shuffle();
        }
    }

    toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.muted) {
            this.element.volume = 0;
        } else {
            this.element.volume = this.volume;
        }
        return this.muted;
    }
}
