import { Track, Library } from './library';
import EventEmitter from './common/events';
import { RepeatMode } from './player';

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
    name: string;
    loaded: boolean;
    nextItemId: number;
    onChange: EventEmitter<QueueEvent>;

    constructor(name: string) {
        this.queueItems = [];
        this.index = -1;
        this.nextItemId = 0;
        this.name = name;
        this.loaded = false;
        this.onChange = new EventEmitter();
    }

    previousTrack(options: { repeatMode: RepeatMode }): Track | null {
        const prevIndex = Math.max(0, this.index - 1);
        if (this.queueItems.length === 0) {
            return null;
        } else if (prevIndex < this.queueItems.length) {
            this.index = prevIndex;
            return this.queueItems[prevIndex].track;
        } else if (options.repeatMode === RepeatMode.Repeat) {
            this.index = this.queueItems.length - 1;
            return this.queueItems[this.index].track;
        } else {
            this.index = 0;
            return null;
        }
    }

    nextTrack(options: {
        repeatMode: RepeatMode;
        songEnded: boolean;
    }): Track | null {
        const nextIndex = this.index + 1;
        if (this.queueItems.length === 0) {
            return null;
        } else if (
            options.repeatMode === RepeatMode.RepeatOne &&
            options.songEnded
        ) {
            return this.queueItems[this.index].track;
        } else if (nextIndex < this.queueItems.length) {
            this.index = nextIndex;
            return this.queueItems[nextIndex].track;
        } else if (options.repeatMode === RepeatMode.Repeat) {
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

interface StoredQueue {
    name: string;
    trackIds: Array<string>;
}

interface StoredQueueStorage {
    lastActive: string;
    queues: Array<StoredQueue>;
}

export class QueueManager {
    queues: Map<string, PlayQueue>;
    activeQueue: string;

    constructor(queues: Map<string, PlayQueue>, lastActive: string) {
        this.queues = queues;
        for (const queue of this.queues.values()) {
            this.saveOnQueueUpdate(queue);
        }
        this.activeQueue = lastActive;
    }

    static async create(library: Library): Promise<QueueManager> {
        const queues = new Map();
        let lastActive = '';
        const storedString = window.localStorage.getItem('playQueues');
        if (storedString) {
            const queueStorage = JSON.parse(storedString) as StoredQueueStorage;
            lastActive = queueStorage.lastActive;
            for (const storedQueue of queueStorage.queues) {
                const queue = await this.queueFromLibrary(
                    storedQueue.name,
                    storedQueue.trackIds,
                    library
                );
                queues.set(queue.name, queue);
            }
        } else {
            const defaultQueue = new PlayQueue('Default');
            queues.set(defaultQueue.name, defaultQueue);
            lastActive = defaultQueue.name;
        }

        return new QueueManager(queues, lastActive);
    }

    saveOnQueueUpdate(queue: PlayQueue): void {
        queue.onChange.on(() => {
            const storeQueues = [];
            for (const queue of this.queues.values()) {
                storeQueues.push({
                    name: queue.name,
                    trackIds: queue.queueItems.map((item) => {
                        return item.track.id;
                    }),
                });
            }
            const queues: StoredQueueStorage = {
                queues: storeQueues,
                lastActive: this.activeQueue,
            };
            window.localStorage.setItem('playQueues', JSON.stringify(queues));
        });
    }

    getActiveQueue(): PlayQueue {
        return this.queues.get(this.activeQueue) as PlayQueue;
    }

    getQueues(): Array<PlayQueue> {
        return [...this.queues.values()];
    }

    static async queueFromLibrary(
        name: string,
        trackIds: Array<string>,
        library: Library
    ): Promise<PlayQueue> {
        const queue = new PlayQueue(name);
        const tracks = await library.getTracksByIds(trackIds);
        queue.extend(tracks);
        return queue;
    }
}
