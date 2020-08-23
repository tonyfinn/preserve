import { Track } from "./library";
import EventEmitter from "./common/events";

export enum QueueEventType {
    AddTrack,
    RemoveTrack,
}

interface AddTrackEvent {
    type: QueueEventType.AddTrack;
    tracks: Array<Track>;
}

interface RemoveTrackEvent {
    type: QueueEventType.RemoveTrack;
    tracks: Array<Track>;
}

export type QueueEvent = AddTrackEvent | RemoveTrackEvent;

export default class PlayQueue {
    tracks: Array<Track>;
    index: number;
    title: string;
    onChange: EventEmitter<QueueEvent>;

    constructor(title: string) {
        this.tracks = [];
        this.index = -1;
        this.title = title;
        this.onChange = new EventEmitter();
    }

    previousTrack(options: {
        repeat: boolean
    }): Track | null {
        const prevIndex = Math.max(0, this.index - 1);
        if (this.tracks.length === 0) {
            return null;
        } else if (prevIndex < this.tracks.length) {
            this.index = prevIndex;
            return this.tracks[prevIndex];
        } else if (options.repeat) {
            this.index = this.tracks.length - 1;
            return this.tracks[this.index];
        } else {
            this.index = 0;
            return null;
        }
    }

    nextTrack(options: {
        repeat: boolean
    }): Track | null {
        const nextIndex = this.index + 1;
        if (this.tracks.length === 0) {
            return null;
        } else if (nextIndex < this.tracks.length) {
            this.index = nextIndex;
            return this.tracks[nextIndex];
        } else if (options.repeat) {
            this.index = 0;
            return this.tracks[0];
        } else {
            this.index = -1;
            return null;
        }
    }

    activeTrack(): Track | null {
        if (this.index === -1) {
            return null;
        } else if (this.tracks[this.index]) {
            return this.tracks[this.index];
        } else {
            return null;
        }
    }

    get(index: number): Track | null {
        return this.tracks[index] || null;
    }

    extend(tracks: Array<Track>): void {
        this.tracks = this.tracks.concat(tracks);
        this.onChange.trigger({
            type: QueueEventType.AddTrack,
            tracks: tracks
        });
    }

    insert(position: number, newTracks: Array<Track>): void {
        this.tracks.splice(position, 0, ...newTracks);
        this.onChange.trigger({
            type: QueueEventType.AddTrack,
            tracks: newTracks
        });
    }

    [Symbol.iterator](): Iterator<Track> {
        return this.tracks[Symbol.iterator]();
    }

    entries(): Iterator<[number, Track]> {
        return this.tracks.entries();
    }

    size(): number {
        return this.tracks.length;
    }
}