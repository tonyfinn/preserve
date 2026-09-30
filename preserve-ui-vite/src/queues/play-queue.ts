import { LibraryManager, Track } from '../library';
import EventEmitter from '../common/events';
import { RepeatMode } from '../player';
import { reactive } from 'vue';

export enum QueueEventType {
    AddItems,
    RemoveItems,
    Rename,
}

interface AddItemsEvent {
    type: QueueEventType.AddItems;
    items: Array<PlayQueueItem>;
    position: number;
}

interface RemoveItemsEvent {
    type: QueueEventType.RemoveItems;
    items: Array<PlayQueueItem>;
}

interface RenameEvent {
    type: QueueEventType.Rename;
    name: string;
}

export type QueueEvent = AddItemsEvent | RemoveItemsEvent | RenameEvent;

export interface PlayQueueItem {
    track: Track;
    queueItemId: string;
}

export class PlayQueue {
    queueItems: Array<PlayQueueItem>;
    id: number;
    index: number;
    _name: string;
    loaded: boolean;
    nextItemId: number;
    onChange: EventEmitter<QueueEvent>;

    constructor(name: string, id?: number) {
        this.queueItems = [];
        this.index = -1;
        this.nextItemId = 0;
        this._name = name;
        this.id = id || new Date().getTime();
        this.loaded = false;
        this.onChange = new EventEmitter();
    }

    get name(): string {
        return this._name;
    }

    set name(newName: string) {
        this._name = newName;
        this.onChange.trigger({
            type: QueueEventType.Rename,
            name: newName,
        });
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
        return this.queueItems[index]?.track || null;
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
        const position = this.queueItems.length;
        this.queueItems = this.queueItems.concat(trackItems);
        this.onChange.trigger({
            type: QueueEventType.AddItems,
            items: trackItems,
            position,
        });
    }

    insert(position: number, newTracks: Array<Track>): void {
        const trackItems = this._makeTrackItems(newTracks);
        this.queueItems.splice(position, 0, ...trackItems);
        this.onChange.trigger({
            type: QueueEventType.AddItems,
            items: trackItems,
            position,
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
    id?: number;
    trackIds: Array<string>;
    items?: Array<PlayQueueItem>;
}

interface StoredQueueStorage {
    lastActive: number;
    queues: Array<StoredQueue>;
}

export interface QueueChangeEvent {
    newQueue: PlayQueue;
}

export class QueueManager {
    queues: Array<PlayQueue>;
    activeQueue: PlayQueue;
    playingQueue: PlayQueue;
    onSwitchActive: EventEmitter<QueueChangeEvent>;
    onSwitchPlaying: EventEmitter<QueueChangeEvent>;
    static nextQueueId: number = new Date().getTime();

    constructor(queues: Array<PlayQueue>, lastActive: number) {
        this.queues = reactive(queues);
        this.onSwitchActive = new EventEmitter();
        this.onSwitchPlaying = new EventEmitter();
        for (const queue of this.queues.values()) {
            this.saveOnQueueUpdate(queue);
        }
        const lastActiveQueue =
            queues.find((q) => q.id === lastActive) || [...queues.values()][0];
        if (lastActiveQueue) {
            this.activeQueue = lastActiveQueue;
            this.playingQueue = lastActiveQueue;
        } else {
            const defaultQueue = this.newQueue();
            this.activeQueue = defaultQueue;
            this.playingQueue = defaultQueue;
        }
    }

    static async create(libraryManager: LibraryManager): Promise<QueueManager> {
        const queues = [];
        let lastActive = -1;
        const storedString = window.localStorage.getItem('playQueues');
        if (storedString) {
            const queueStorage = JSON.parse(storedString) as StoredQueueStorage;
            lastActive = queueStorage.lastActive;
            for (const storedQueue of queueStorage.queues) {
                const queue = await this.queueFromLibrary(
                    storedQueue.name,
                    storedQueue.trackIds,
                    storedQueue.id,
                    libraryManager
                );
                queues.push(queue);
            }
            console.log('Loaded queues ', queues);
        } else {
            const defaultQueue = new PlayQueue('Default');
            queues.push(defaultQueue);
            lastActive = defaultQueue.id;
            console.log('Created queues: ', queues);
        }

        return new QueueManager(queues, lastActive);
    }

    queuesToExportString(): string {
        const storeQueues = [];
        for (const queue of this.queues.values()) {
            storeQueues.push({
                id: queue.id,
                name: queue.name,
                trackIds: queue.queueItems.map((item) => {
                    return item.track.id;
                }),
                items: queue.queueItems,
            });
        }
        const queues: StoredQueueStorage = {
            queues: storeQueues,
            lastActive: this.activeQueue.id,
        };
        return JSON.stringify(queues);
    }

    saveQueues(): void {
        window.localStorage.setItem('playQueues', this.queuesToExportString());
    }

    saveOnQueueUpdate(queue: PlayQueue): void {
        queue.onChange.on(() => {
            this.saveQueues();
        });
    }

    getActiveQueue(): PlayQueue {
        return this.activeQueue;
    }

    setActiveQueue(queue: PlayQueue): void {
        this.activeQueue = queue;
        this.onSwitchActive.trigger({
            newQueue: queue,
        });
    }

    setPlayingQueue(queue: PlayQueue): void {
        this.playingQueue = queue;
        this.onSwitchPlaying.trigger({
            newQueue: queue,
        });
    }

    getQueues(): Array<PlayQueue> {
        return [...this.queues.values()];
    }

    newQueue(): PlayQueue {
        let index = 0;
        let foundFreeName = false;
        let queueName = 'Untitled';
        while (!foundFreeName) {
            index += 1;
            let valid = true;
            for (const queue of this.queues.values()) {
                if (queue.name === queueName) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                foundFreeName = true;
                break;
            } else {
                queueName = `Untitled ${index}`;
            }
        }

        const newQueue = new PlayQueue(queueName, QueueManager.nextQueueId++);
        this.queues.push(newQueue);
        this.activeQueue = newQueue;
        this.saveQueues();
        return newQueue;
    }

    deleteQueue(queue: PlayQueue): void {
        this.queues = this.queues.filter((q) => q.id !== queue.id);
        this.saveQueues();
    }

    static async queueFromLibrary(
        name: string,
        trackIds: Array<string>,
        id: number | undefined,
        libraryManager: LibraryManager
    ): Promise<PlayQueue> {
        if (!id) {
            id = QueueManager.nextQueueId++;
        }
        const queue = new PlayQueue(name, id);
        const tracks = await libraryManager.getTracksByIds(trackIds);
        queue.extend(tracks);
        return queue;
    }
}
