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
        <div
            :class="{
                'playlist__column-picker': true,
                'playlist__column-picker--picking': pickingColumns,
            }"
        >
            <i
                class="fi-list-bullet"
                v-if="!pickingColumns"
                title="Customise Columns"
                @click="pickingColumns = true"
            ></i>
            <ul class="columns" v-if="pickingColumns">
                <li v-for="column in columns" :key="column.title">
                    <input
                        :id="'visibility-column-' + column.title"
                        type="checkbox"
                        v-model="column.visible"
                    />
                    <label :for="'visibility-column-' + column.title">{{
                        column.title
                    }}</label>
                </li>
            </ul>
            <button v-if="pickingColumns" @click="pickingColumns = false">
                Done
            </button>
        </div>
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
                    <th v-for="column in visibleColumns" :key="column.title">
                        {{ column.title }}
                    </th>
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
                            index === nowPlayingIndex && isPlaying(activeQueue),
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
                    <td v-for="column in visibleColumns" :key="column.title">
                        {{ column.renderer(queueItem) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { AudioPlayer, PlaybackEventType } from '../player';
import {
    Library,
    Track,
    albumArtistNames,
    ItemStub,
    artistNames,
} from '../library';
import { QueueManager, PlayQueueItem, PlayQueue } from '.';
import { formatTime } from '../common/utils';

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

interface ColumnDef<T> {
    title: string;
    visible: boolean;
    renderer: (row: RowItem<T>) => string;
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

        const columns: Array<ColumnDef<PlayQueueItem>> = [
            {
                title: 'Disc Number',
                visible: false,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return row.data.track.discNumber
                        ? '' + row.data.track.discNumber
                        : '--';
                },
            },
            {
                title: 'Track Number',
                visible: false,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return row.data.track.trackNumber
                        ? '' + row.data.track.trackNumber
                        : '--';
                },
            },
            {
                title: 'Title',
                visible: true,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return row.data.track.name;
                },
            },
            {
                title: 'Artist',
                visible: true,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return artistNames(row.data.track);
                },
            },
            {
                title: 'Album Artist',
                visible: false,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return albumArtistNames(row.data.track);
                },
            },
            {
                title: 'Album',
                visible: true,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return row.data.track.album.name;
                },
            },
            {
                title: 'Duration',
                visible: false,
                renderer(row: RowItem<PlayQueueItem>): string {
                    return formatTime(row.data.track.duration);
                },
            },
        ];
        return {
            playQueues: this.queueManager.getQueues(),
            activeQueue,
            playingQueue,
            columns,
            pickingColumns: false,
            selectedItems: [] as Array<RowItem<PlayQueueItem>>,
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
            this.activeQueue = evt.newQueue;
        });
        this.queueManager.onSwitchPlaying.on((evt) => {
            this.playingQueue = evt.newQueue;
        });
    },
    computed: {
        visibleColumns(): Array<ColumnDef<PlayQueueItem>> {
            return this.columns.filter((item) => item.visible);
        },
        queueItems(): Array<RowItem<PlayQueueItem>> {
            return rowItemsFromQueue(this.activeQueue);
        },
    },
    methods: {
        isPlaying(queue: PlayQueue) {
            return queue.id === this.player.getQueue().id;
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

.playlist__queue-wrapper {
    display: grid;
    align-items: start;
    width: 100%;
    grid-template: auto 1fr / 1fr auto;
}

.playlist__queue-wrapper--dragover {
    border: 3px dashed $colors-text;
}

.playlist__queue-wrapper--dragover .playlist__queue {
    border-bottom: 3px dashed $colors-text;
}

.playlist__column-picker {
    grid-row: 1;
    grid-column: 2;
    position: sticky;
    top: 2em;
    z-index: 1;
    padding: $dims-padding-dense;

    &--picking {
        padding: $dims-padding;
        background-color: $colors-background;
        border: 1px solid white;
    }

    ul {
        list-style-type: none;
    }

    label {
        display: inline-block;
        padding: $dims-padding-dense;
    }

    button {
        width: 100%;
    }
}

.playlist__queue {
    padding: $dims-padding;
    border-collapse: collapse;
    margin-bottom: $dims-bottom-spacing;
    grid-row: 1 / 3;
    grid-column: 1 / 3;
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
