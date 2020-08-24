import { Track } from './library';
import EventEmitter from './common/events';

export enum QueueEventType {
    AddItems,
    RemoveItems,
}

interface AddItemsEvent {
    type: QueueEventType.AddItems;
    items: Array<PlayQueueItem>;
}

interface RemoveItemsEvent {
    type: QueueEventType.RemoveItems;
    items: Array<PlayQueueItem>;
}

export type QueueEvent = AddItemsEvent | RemoveItemsEvent;

export interface PlayQueueItem {
    track: Track;
    queueItemId: string;
}

export default class PlayQueue {
    queueItems: Array<PlayQueueItem>;
    index: number;
    title: string;
    nextItemId: number;
    onChange: EventEmitter<QueueEvent>;

    constructor(title: string) {
        this.queueItems = [];
        this.index = -1;
        this.nextItemId = 0;
        this.title = title;
        this.onChange = new EventEmitter();
    }

    previousTrack(options: { repeat: boolean }): Track | null {
        const prevIndex = Math.max(0, this.index - 1);
        if (this.queueItems.length === 0) {
            return null;
        } else if (prevIndex < this.queueItems.length) {
            this.index = prevIndex;
            return this.queueItems[prevIndex].track;
        } else if (options.repeat) {
            this.index = this.queueItems.length - 1;
            return this.queueItems[this.index].track;
        } else {
            this.index = 0;
            return null;
        }
    }

    nextTrack(options: { repeat: boolean }): Track | null {
        const nextIndex = this.index + 1;
        if (this.queueItems.length === 0) {
            return null;
        } else if (nextIndex < this.queueItems.length) {
            this.index = nextIndex;
            return this.queueItems[nextIndex].track;
        } else if (options.repeat) {
            this.index = 0;
            return this.queueItems[0].track;
        } else {
            this.index = -1;
            return null;
        }
    }

    activeTrack(): Track | null {
        if (this.index === -1) {
            return null;
        } else if (this.queueItems[this.index]) {
            return this.queueItems[this.index].track;
        } else {
            return null;
        }
    }

    getTrack(index: number): Track | null {
        return this.queueItems[index].track || null;
    }

    _makeTrackItems(tracks: Array<Track>): Array<PlayQueueItem> {
        const trackItems = [];
        for (const track of tracks) {
            trackItems.push({
                queueItemId: '' + this.nextItemId++,
                track,
            });
        }
        return trackItems;
    }

    extend(tracks: Array<Track>): void {
        const trackItems = this._makeTrackItems(tracks);
        this.queueItems = this.queueItems.concat(trackItems);
        this.onChange.trigger({
            type: QueueEventType.AddItems,
            items: trackItems,
        });
    }

    insert(position: number, newTracks: Array<Track>): void {
        const trackItems = this._makeTrackItems(newTracks);
        this.queueItems.splice(position, 0, ...trackItems);
        this.onChange.trigger({
            type: QueueEventType.AddItems,
            items: trackItems,
        });
    }

    remove(items: Array<PlayQueueItem>): void {
        const removeIds = items.map((item) => item.queueItemId);
        const removedItems = [];
        const keptItems = [];

        for (const item of this.queueItems) {
            if (removeIds.includes(item.queueItemId)) {
                removedItems.push(item);
            } else {
                keptItems.push(item);
            }
        }
        this.queueItems = keptItems;
        this.onChange.trigger({
            type: QueueEventType.RemoveItems,
            items: removedItems,
        });
    }

    [Symbol.iterator](): Iterator<PlayQueueItem> {
        return this.queueItems[Symbol.iterator]();
    }

    entries(): Iterator<[number, PlayQueueItem]> {
        return this.queueItems.entries();
    }

    size(): number {
        return this.queueItems.length;
    }
}
