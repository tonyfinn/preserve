import { Library, Track, artistNames } from './library';
import EventEmitter from './common/events';
import PlayQueue from './play-queue';

import Hls from 'hls.js';

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
    library: Library;
    playQueue: PlayQueue;
    playing: boolean;
    repeat: boolean;
    shuffle: boolean;
    shuffleOrder: Array<number>;
    playbackEvent: EventEmitter<PlaybackEvent>;
    static instance: AudioPlayer;

    constructor(library: Library) {
        this.element = document.createElement('audio');
        this.library = library;
        this.playQueue = new PlayQueue('Default');
        this.hls = null;
        this.useHls = false;
        this.playing = false;
        this.repeat = false;
        this.shuffle = false;
        this.shuffleOrder = [];
        this.playbackEvent = new EventEmitter();
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

        window.addEventListener('keydown', (evt) => {
            console.log(evt);
            if (evt.key === 'MediaPause') {
                this._pause();
            } else if (evt.key === 'MediaPlay') {
                this._play();
            } else if (evt.key === 'MediaPlayPause') {
                this.togglePlay();
            } else {
                return;
            }
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    static getOrCreateInstance(library: Library): AudioPlayer {
        if (AudioPlayer.instance) {
            return AudioPlayer.instance;
        } else {
            const player = new AudioPlayer(library);
            AudioPlayer.instance = player;
            return player;
        }
    }

    activeTrack(): Track | null {
        return this.playQueue.activeTrack();
    }

    getQueue(): PlayQueue {
        return this.playQueue;
    }

    setQueue(playQueue: PlayQueue): void {
        this.playQueue = playQueue;
    }

    play(index: number): void {
        const track = this.playQueue.getTrack(index);
        if (track) {
            this.playQueue.index = index;
            this.playTrack(track);
        }
    }

    _startPlayback(track: Track): void {
        this.element.play();
        this.playing = true;
        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.name,
                album: track.album.name,
                artist: artistNames(track),
            });
            navigator.mediaSession.playbackState = 'playing';
        }
        this.playbackEvent.trigger({
            type: PlaybackEventType.Play,
            track,
        });
    }

    _playHls(track: Track): void {
        if (this.hls) {
            this.hls.destroy();
        }
        const playbackUrl = this.library.getPlaybackUrl(track);
        this.hls = new Hls({
            manifestLoadingTimeOut: 20000,
            xhrSetup: function (xhr) {
                xhr.withCredentials = true;
            },
        });
        this.hls.loadSource(playbackUrl);
        this.hls.attachMedia(this.element);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this._startPlayback(track);
        });
        this.hls.on(Hls.Events.ERROR, (_evt, data) => {
            console.error('HLS error', data);
        });
    }

    _playNative(track: Track): void {
        this.element.src = this.library.getPlaybackUrl(track);
        this.element.load();
        this.element.play().then(() => {
            this._startPlayback(track);
        });
    }

    playTrack(track: Track): void {
        if (this.useHls) {
            this._playHls(track);
        } else {
            this._playNative(track);
        }
    }

    previousTrack(): void {
        const prevTrack = this.playQueue.previousTrack({
            repeat: this.repeat,
        });
        if (prevTrack) {
            this.playTrack(prevTrack);
        } else {
            this.playing = false;
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
            });
        }
    }

    nextTrack(): void {
        const nextTrack = this.playQueue.nextTrack({
            repeat: this.repeat,
        });
        if (nextTrack) {
            this.playTrack(nextTrack);
        } else {
            this.element.pause();
            this.playing = false;
            this.playbackEvent.trigger({
                type: PlaybackEventType.End,
            });
        }
    }

    _handleTrackEnd(): void {
        this.nextTrack();
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

    _shuffle(): void {
        const shuffleOrder = Array(this.playQueue.size());
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

    toggleShuffle(): boolean {
        this.shuffle = !this.shuffle;
        this._shuffle();
        return this.shuffle;
    }
}
