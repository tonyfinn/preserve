<template>
    <div
        :class="{
            'playlist__queue-wrapper': true,
            'playlist__queue-wrapper--dragover': dragOver !== 0,
            'playlist__queue-wrapper--dragover-self':
                dragOver !== 0 && childDragOver === 0,
        }"
        @dragenter="listDragEnter"
        @dragleave="listDragLeave"
        @dragover.prevent
        @drop.stop.prevent="listDrop"
    >
        <table
            role="grid"
            aria-label="Play Queue"
            aria-multiselectable="true"
            class="playlist__queue"
            @keydown.up.exact.stop.prevent="focusPrevious"
            @keydown.down.exact.stop.prevent="focusNext"
            @keydown.space.stop.prevent="toggleSelectFocused"
            @keydown.enter.stop.prevent="playFocusedItem"
            @keydown.delete.stop.prevent="removeSelectedItems"
            @keydown.home.ctrl.stop.prevent="focusFirst"
            @keydown.end.ctrl.stop.prevent="focusLast"
        >
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Album Artist</th>
                    <th>Album</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(queueItem, index) in queueItems"
                    :key="queueItem.id"
                    :class="{
                        'playlist__track--selected': queueItem.selected,
                        'playlist__track--dragover': queueItem.dragCount !== 0,
                        'playlist__track--playing':
                            index === nowPlayingIndex &&
                            activeQueue === playingQueue,
                        'playlist__track--focused': index === focusIndex,
                    }"
                    :aria-selected="queueItem.selected"
                    :tabindex="
                        focusIndex === index || (focusIndex < 0 && index === 0)
                            ? 0
                            : -1
                    "
                    @focus.stop="focusItem(index)"
                    @click.exact="selectItem(queueItem, index)"
                    @mousedown.ctrl.prevent
                    @mousedown.shift.prevent
                    @click.ctrl.exact.prevent.stop="appendSelectItem(queueItem)"
                    @click.shift.exact.prevent.stop="
                        extendSelectItem(queueItem, index)
                    "
                    @dblclick.prevent.stop="playTrack(index)"
                    @dragenter="itemDragEnter(queueItem, $event)"
                    @dragleave="itemDragLeave(queueItem, $event)"
                    @drop.stop.prevent="itemDrop(queueItem, index, $event)"
                    @dragover.prevent
                >
                    <td>{{ queueItem.data.track.name }}</td>
                    <td>{{ formatAlbumArtists(queueItem.data.track) }}</td>
                    <td>{{ queueItem.data.track.album.name }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { AudioPlayer, PlaybackEventType } from '../player';
import { Library, Track, albumArtistNames, ItemStub } from '../library';
import { QueueManager, PlayQueueItem, PlayQueue } from '.';

export interface RowItem<T> {
    id: string;
    selected: boolean;
    data: T;
    dragCount: number;
}

function rowItemsFromQueue(queue: PlayQueue): Array<RowItem<PlayQueueItem>> {
    const rowItems = [];
    for (const track of queue) {
        const rowItem = {
            id: track.queueItemId,
            selected: false,
            data: track,
            dragCount: 0,
        };
        rowItems.push(rowItem);
    }
    return rowItems;
}

export default defineComponent({
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
        library: {
            type: Library,
            required: true,
        },
        queueManager: {
            type: QueueManager,
            required: true,
        },
    },
    data() {
        const activeQueue = this.queueManager.getActiveQueue();
        const playingQueue = this.player.getQueue();
        return {
            playQueues: this.queueManager.getQueues(),
            activeQueue,
            playingQueue,
            queueItems: rowItemsFromQueue(activeQueue),
            selectedItems: [] as Array<RowItem<PlayQueueItem>>,
            queueTracksChangeHandlerId: -1,
            focusIndex: -1,
            dragOver: 0,
            nowPlayingIndex: -1,
            childDragOver: 0,
        };
    },
    created() {
        this.player.setQueue(this.activeQueue);
        this.player.playbackEvent.on((evt) => {
            if (evt.type === PlaybackEventType.Play) {
                this.nowPlayingIndex = evt.queueIndex;
            } else if (evt.type === PlaybackEventType.End) {
                this.nowPlayingIndex = -1;
            }
        });
        this.queueManager.onSwitchActive.on((evt) => {
            this.activeQueue.onChange.off(this.queueTracksChangeHandlerId);
            this.activeQueue = evt.newQueue;
            this.readActiveQueueTracks();
            this.queueTracksChangeHandlerId = this.activeQueue.onChange.on(
                this.readActiveQueueTracks
            );
        });
        this.queueManager.onSwitchPlaying.on((evt) => {
            this.playingQueue = evt.newQueue;
        });
        this.queueTracksChangeHandlerId = this.activeQueue.onChange.on(
            this.readActiveQueueTracks
        );
    },
    methods: {
        readActiveQueueTracks() {
            this.queueItems = rowItemsFromQueue(this.activeQueue);
        },
        formatAlbumArtists(item: Track) {
            return albumArtistNames(item);
        },
        addTracks(
            items: Array<Track>,
            options: {
                playNow: boolean;
            }
        ) {
            const nextIndex = this.activeQueue.size();
            this.activeQueue.extend(items);
            nextTick(() => {
                this.ensureVisible(Math.max(0, this.activeQueue.size() - 2));
            });
            if (options.playNow) {
                this.playTrack(nextIndex);
            }
        },
        selectItem(item: RowItem<PlayQueueItem>, index: number) {
            this.clearSelection();
            item.selected = true;
            this.selectedItems = [item];
            this.focusItem(index);
        },
        appendSelectItem(item: RowItem<PlayQueueItem>) {
            item.selected = true;
            this.selectedItems.push(item);
        },
        toggleSelectItem(item: RowItem<PlayQueueItem>) {
            if (item.selected) {
                item.selected = false;
                this.selectedItems = this.selectedItems.filter(
                    (i) => i.id !== item.id
                );
            } else {
                this.appendSelectItem(item);
            }
        },
        clearSelection() {
            for (const selectedItem of this.selectedItems) {
                selectedItem.selected = false;
            }
            this.selectedItems = [];
            this.focusIndex = -1;
        },
        extendSelectItem(
            selectTargetItem: RowItem<PlayQueueItem>,
            targetItemIndex: number
        ) {
            if (this.selectedItems.length === 0) {
                this.selectItem(selectTargetItem, targetItemIndex);
            } else {
                let firstSelectedIndex = -1;
                for (let i = 0; i < this.queueItems.length; i++) {
                    let currentItem = this.queueItems[i];
                    if (firstSelectedIndex === -1 && currentItem.selected) {
                        firstSelectedIndex = i;
                    }
                }
                this.clearSelection();
                let startIdx = Math.min(firstSelectedIndex, targetItemIndex);
                let endIdx = Math.max(firstSelectedIndex, targetItemIndex) + 1;
                let newSelection = this.queueItems.slice(startIdx, endIdx);

                for (const item of newSelection) {
                    item.selected = true;
                }
                this.selectedItems = newSelection;
            }
        },
        playTrack(index: number) {
            if (this.activeQueue.name !== this.player.playQueue.name) {
                this.player.setQueue(this.activeQueue);
                this.playingQueue = this.activeQueue;
            }
            this.player.play(index);
        },
        focusItem(index: number) {
            this.focusIndex = index;
            this.$el
                .querySelector(`tbody tr:nth-child(${index + 1})`)
                .focus({ preventScroll: true });
            this.ensureVisible(index);
        },
        focusFirst() {
            this.focusItem(0);
        },
        focusLast() {
            this.focusItem(this.queueItems.length - 1);
        },
        focusPrevious() {
            const prevItem = Math.max(0, this.focusIndex - 1);
            this.focusItem(prevItem);
        },
        focusNext() {
            const nextItem = Math.min(
                this.queueItems.length - 1,
                this.focusIndex + 1
            );
            this.focusItem(nextItem);
        },
        toggleSelectFocused() {
            this.toggleSelectItem(this.queueItems[this.focusIndex]);
        },
        removeSelectedItems() {
            const itemsToRemove = this.selectedItems.map((x) => x.data);
            this.activeQueue.remove(itemsToRemove);
            this.selectedItems = [];
        },
        playFocusedItem() {
            this.playTrack(this.focusIndex);
        },
        itemDragEnter(item: RowItem<PlayQueueItem>, evt: DragEvent) {
            this.childDragOver += 1;
            if (
                evt.dataTransfer?.getData(
                    'application/x-preserve-library-item-stub'
                )
            ) {
                item.dragCount += 1;
                evt.preventDefault();
            }
        },
        itemDragLeave(item: RowItem<PlayQueueItem>, _evt: DragEvent) {
            this.childDragOver -= 1;
            item.dragCount -= 1;
        },
        listDragEnter(evt: DragEvent) {
            if (
                evt.dataTransfer?.getData(
                    'application/x-preserve-library-item-stub'
                )
            ) {
                this.dragOver += 1;
                evt.preventDefault();
            }
        },
        listDragLeave(_evt: DragEvent) {
            this.dragOver -= 1;
        },
        async listDrop(evt: DragEvent) {
            const transferData = evt.dataTransfer?.getData(
                'application/x-preserve-library-item-stub'
            );
            this.dragOver = 0;
            this.childDragOver = 0;
            if (transferData) {
                evt.preventDefault();
                const itemStubs = JSON.parse(transferData) as Array<ItemStub>;
                const tracksByItem = await Promise.all(
                    itemStubs.map((item) => this.library.getChildTracks(item))
                );
                let tracks: Array<Track> = [];
                for (const itemTrackList of tracksByItem) {
                    tracks = tracks.concat(itemTrackList);
                }
                this.activeQueue.extend(tracks);
            }
        },
        async itemDrop(
            item: RowItem<PlayQueueItem>,
            index: number,
            evt: DragEvent
        ) {
            const transferData = evt.dataTransfer?.getData(
                'application/x-preserve-library-item-stub'
            );
            item.dragCount = 0;
            this.dragOver = 0;
            this.childDragOver = 0;
            if (transferData) {
                evt.preventDefault();
                const itemStubs = JSON.parse(transferData) as Array<ItemStub>;
                const tracksByItem = await Promise.all(
                    itemStubs.map((item) => this.library.getChildTracks(item))
                );
                let tracks: Array<Track> = [];
                for (const itemTrackList of tracksByItem) {
                    tracks = tracks.concat(itemTrackList);
                }
                this.activeQueue.insert(index, tracks);
            }
        },
        ensureVisible(index: number) {
            const trackRowRect = this.$el
                .querySelector(`tbody tr:nth-child(${index + 1})`)
                .getBoundingClientRect();
            const container = this.$el.parentElement;
            const containerRect = container.getBoundingClientRect();
            const elPosInContainer = trackRowRect.top - containerRect.top;

            if (!trackRowRect) {
                console.warn(`Tried to scroll to nonexistent index ${index}`);
                return;
            }

            if (elPosInContainer < 3 * trackRowRect.height) {
                container.scrollBy(
                    0,
                    elPosInContainer - 3 * trackRowRect.height
                );
            } else if (
                elPosInContainer + 3 * trackRowRect.height >
                containerRect.height
            ) {
                container.scrollBy(
                    0,
                    elPosInContainer +
                        3 * trackRowRect.height -
                        containerRect.height
                );
            }
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

.playlist__queue-wrapper--dragover {
    border: 3px dashed $colors-text;
}

.playlist__queue-wrapper--dragover .playlist__queue {
    border-bottom: 3px dashed $colors-text;
}

.playlist__queue {
    width: 100%;
    padding: $dims-padding;
    border-collapse: collapse;
    margin-bottom: $dims-bottom-spacing;
}

.playlist__queue th {
    padding: $dims-padding-dense;
    background-color: $colors-background;
    text-align: left;
    position: sticky;
    top: 2em;

    &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        border-bottom: 1px solid white;
    }
}

.playlist__queue td {
    padding: $dims-padding-dense;
    border: 0;
}

.playlist__queue tr:nth-child(even) {
    background: $colors-background-alt;
}

.playlist__queue tbody tr {
    cursor: pointer;

    &.playlist__track--playing {
        font-weight: bold;
        font-style: italic;
        background: $colors-active;
    }

    &.playlist__track--selected {
        background: $colors-selected;
    }

    &.playlist__track--dragover {
        border-top: 3px dashed $colors-text;
    }

    &:hover,
    &.playlist__track--focused {
        background: $colors-highlight;
    }
}
</style>
