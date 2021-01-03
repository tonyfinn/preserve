<template>
    <div
        :class="{
            'playlist__queue-wrapper': true,
            'playlist__queue-wrapper--dragover': dragOver !== 0,
            'playlist__queue-wrapper--dragover-self':
                dragOver !== 0 && childDragOver === 0,
        }"
        id="active-play-queue-panel"
        role="tabpanel"
        :aria-labelledby="'playQueue-' + activeQueue.id + '-name'"
        @dragenter="listDragEnter"
        @dragleave="listDragLeave"
        @dragover.prevent
        @drop.stop.prevent="listDrop"
    >
        <table
            role="grid"
            aria-label="Active Play Queue"
            aria-multiselectable="true"
            class="playlist__queue"
            @keydown.up.exact.stop.prevent="focusPrevious"
            @keydown.down.exact.stop.prevent="focusNext"
            @keydown.left.exact.stop.prevent="focusPreviousColumn"
            @keydown.right.exact.stop.prevent="focusNextColumn"
            @keydown.space.stop.prevent="toggleSelectFocused"
            @keydown.enter.stop.prevent="playFocusedItem"
            @keydown.delete.stop.prevent="removeSelectedItems"
            @keydown.home.exact.stop.prevent="focusFirstColumn"
            @keydown.end.exact.stop.prevent="focusLastColumn"
            @keydown.home.ctrl.stop.prevent="focusFirst"
            @keydown.end.ctrl.stop.prevent="focusLast"
        >
            <thead>
                <tr>
                    <th
                        v-for="column in visibleColumns"
                        :key="column.def.field"
                    >
                        {{ column.def.title }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(queueItem, rowIndex) in queueItems"
                    :data-testid="testIdFor(queueItem)"
                    :key="queueItem.id"
                    :class="{
                        'playlist__track--selected': queueItem.selected,
                        'playlist__track--dragover': queueItem.dragCount !== 0,
                        'playlist__track--playing':
                            rowIndex === nowPlayingIndex &&
                            isPlaying(activeQueue),
                        'playlist__track--focused': isRowFocused(rowIndex),
                    }"
                    :aria-selected="queueItem.selected"
                    :aria-label="queueItem.data.title"
                    @mousedown.stop.exact="selectItem(queueItem, rowIndex)"
                    @mousedown.ctrl.stop.exact="toggleSelectItem(queueItem)"
                    @mousedown.shift.stop.exact="
                        extendSelectItem(queueItem, rowIndex)
                    "
                    @dblclick.prevent.stop="playTrack(rowIndex)"
                    draggable="true"
                    @dragstart.stop="itemDragStart($event)"
                    @dragend.stop="dragEnd"
                    @dragenter="itemDragEnter(queueItem, $event)"
                    @dragleave="itemDragLeave(queueItem, $event)"
                    @drop.stop.prevent="itemDrop(queueItem, rowIndex, $event)"
                    @dragover.prevent
                >
                    <td
                        v-for="(column, columnIndex) in visibleColumns"
                        :class="{
                            'playlist__track__cell--focused': isCellFocused(
                                rowIndex,
                                columnIndex
                            ),
                        }"
                        :aria-selected="queueItem.selected"
                        :tabindex="
                            isCellFocused(rowIndex, columnIndex) ? 0 : -1
                        "
                        :key="column.def.field"
                        @focus.stop="focusItem(rowIndex, columnIndex)"
                    >
                        {{ column.def.renderer(queueItem) }}
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            data-testid="play-queue-column-picker"
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
            <h3 v-if="pickingColumns">Visible Columns</h3>
            <column-picker
                v-if="pickingColumns"
                v-model="columns"
            ></column-picker>
            <button v-if="pickingColumns" @click="pickingColumns = false">
                Done
            </button>
        </div>
        <div class="playlist__drag-info">
            <ul>
                <li v-for="item in draggingItems" :key="item.id">
                    {{ item.data.track.name }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { AudioPlayer, PlaybackEventType } from '../player';
import { Track, ItemStub, LibraryManager } from '../library';
import { QueueManager, PlayQueueItem, PlayQueue } from '.';
import { ITEM_STUB_MIME_TYPE } from '../common/constants';
import { RowItem, Column, ColumnPicker } from '../common/table';
import { PlayColumn, savedQueueColumns } from './columns';
import { Settings } from '../common/settings';

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
    components: { ColumnPicker },
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
        libraryManager: {
            type: LibraryManager,
            required: true,
        },
        queueManager: {
            type: QueueManager,
            required: true,
        },
        settings: {
            type: Settings,
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
            columns: savedQueueColumns(this.settings),
            pickingColumns: false,
            selectedItems: [] as Array<RowItem<PlayQueueItem>>,
            draggingItems: [] as Array<RowItem<PlayQueueItem>>,
            focusRowIndex: -1,
            focusColumnIndex: 0,
            dragOver: 0,
            nowPlayingIndex: -1,
            childDragOver: 0,
        };
    },
    watch: {
        columns(newColumns: Array<Column<PlayColumn, PlayQueueItem>>) {
            this.settings.set(
                'playlistColumns',
                newColumns.filter((x) => x.visible).map((x) => x.def.field)
            );
        },
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
        visibleColumns(): Array<Column<PlayColumn, PlayQueueItem>> {
            return this.columns.filter((item) => item.visible);
        },
        queueItems(): Array<RowItem<PlayQueueItem>> {
            return rowItemsFromQueue(this.activeQueue);
        },
    },
    methods: {
        testIdFor(item: RowItem<PlayQueueItem>): string | undefined {
            if (this.nowPlayingIndex === this.queueItems.indexOf(item)) {
                return 'play-queue-active-track';
            }
        },
        isPlaying(queue: PlayQueue) {
            return queue.id === this.player.getQueue().id;
        },
        isRowFocused(rowIndex: number) {
            return (
                (this.focusRowIndex < 0 && rowIndex === 0) ||
                rowIndex === this.focusRowIndex
            );
        },
        isColumnFocused(columnIndex: number) {
            return (
                (this.focusColumnIndex < 0 && columnIndex === 0) ||
                columnIndex === this.focusColumnIndex
            );
        },
        isCellFocused(rowIndex: number, columnIndex: number) {
            return (
                this.isRowFocused(rowIndex) && this.isColumnFocused(columnIndex)
            );
        },
        itemDragStart(evt: DragEvent) {
            if (this.selectedItems.length > 0) {
                const textValues = this.selectedItems
                    .map((item) => `track: ${item.data.track.name}`)
                    .join('\n');
                evt.dataTransfer?.setData('text/plain', textValues);
                const jsonValues = this.selectedItems.map((item) => {
                    return {
                        type: item.data.track.type,
                        name: item.data.track.name,
                        id: item.data.track.id,
                    };
                });
                evt.dataTransfer?.setData(
                    ITEM_STUB_MIME_TYPE,
                    JSON.stringify(jsonValues)
                );
                this.draggingItems = [...this.selectedItems];
                const dragEl = this.$el.querySelector('.playlist__drag-info');
                evt.dataTransfer?.setDragImage(dragEl, 10, dragEl.width / 2);
            } else {
                evt.preventDefault();
            }
        },
        dragEnd() {
            this.draggingItems = [];
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
        selectItem(item: RowItem<PlayQueueItem>, rowIndex: number) {
            for (const selectedItem of this.selectedItems) {
                selectedItem.selected = false;
            }
            item.selected = true;
            this.selectedItems = [item];
            if (this.focusRowIndex !== rowIndex) {
                this.focusItem(rowIndex);
            }
        },
        toggleSelectItem(item: RowItem<PlayQueueItem>) {
            if (item.selected) {
                item.selected = false;
                this.selectedItems = this.selectedItems.filter(
                    (i) => i.id !== item.id
                );
            } else {
                item.selected = true;
                this.selectedItems.push(item);
            }
            this.$forceUpdate();
        },
        clearSelection() {
            for (const selectedItem of this.selectedItems) {
                selectedItem.selected = false;
            }
            this.selectedItems = [];
            this.focusRowIndex = -1;
            this.focusColumnIndex = -1;
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
        focusItem(rowIndex: number, columnIndex?: number) {
            this.focusRowIndex = rowIndex;
            this.focusColumnIndex =
                columnIndex !== undefined ? columnIndex : this.focusColumnIndex;
            const focusedColumnIndex = Math.max(0, this.focusColumnIndex);
            this.$el
                .querySelector(
                    `tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${
                        focusedColumnIndex + 1
                    })`
                )
                .focus({ preventScroll: true });
            this.ensureVisible(rowIndex);
        },
        focusFirst() {
            this.focusItem(0);
        },
        focusLast() {
            this.focusItem(this.queueItems.length - 1);
        },
        focusPrevious() {
            const prevItem = Math.max(0, this.focusRowIndex - 1);
            this.focusItem(prevItem);
        },
        focusNext() {
            const nextItem = Math.min(
                this.queueItems.length - 1,
                this.focusRowIndex + 1
            );
            this.focusItem(nextItem);
        },
        focusFirstColumn() {
            this.focusItem(this.focusRowIndex, 0);
        },
        focusLastColumn() {
            this.focusItem(this.focusRowIndex, this.visibleColumns.length - 1);
        },
        focusPreviousColumn() {
            const prevColumn = Math.max(0, this.focusColumnIndex - 1);
            this.focusItem(this.focusRowIndex, prevColumn);
        },
        focusNextColumn() {
            const nextColumn = Math.min(
                this.visibleColumns.length - 1,
                this.focusColumnIndex + 1
            );
            this.focusItem(this.focusRowIndex, nextColumn);
        },
        toggleSelectFocused() {
            this.toggleSelectItem(this.queueItems[this.focusRowIndex]);
        },
        removeItems(items: Array<RowItem<PlayQueueItem>>) {
            this.activeQueue.remove(items.map((x) => x.data));
        },
        removeSelectedItems() {
            this.removeItems(this.selectedItems);
            this.selectedItems = [];
        },
        playFocusedItem() {
            this.playTrack(this.focusRowIndex);
        },
        itemDragEnter(item: RowItem<PlayQueueItem>, evt: DragEvent) {
            this.childDragOver += 1;
            if (evt.dataTransfer?.getData(ITEM_STUB_MIME_TYPE)) {
                item.dragCount += 1;
                evt.preventDefault();
            }
        },
        itemDragLeave(item: RowItem<PlayQueueItem>, _evt: DragEvent) {
            this.childDragOver -= 1;
            item.dragCount -= 1;
        },
        listDragEnter(evt: DragEvent) {
            if (evt.dataTransfer?.getData(ITEM_STUB_MIME_TYPE)) {
                this.dragOver += 1;
                evt.preventDefault();
            }
        },
        listDragLeave(_evt: DragEvent) {
            this.dragOver -= 1;
        },
        async listDrop(evt: DragEvent) {
            const transferData = evt.dataTransfer?.getData(ITEM_STUB_MIME_TYPE);
            this.dragOver = 0;
            this.childDragOver = 0;
            if (transferData) {
                evt.preventDefault();
                const itemStubs = JSON.parse(transferData) as Array<ItemStub>;
                const tracksByItem = await Promise.all(
                    itemStubs.map((item) =>
                        this.libraryManager.getChildTracks(item)
                    )
                );
                let tracks: Array<Track> = [];
                for (const itemTrackList of tracksByItem) {
                    tracks = tracks.concat(itemTrackList);
                }
                this.activeQueue.extend(tracks);
            }
            if (this.draggingItems) {
                this.removeItems(this.draggingItems);
                this.draggingItems = [];
            }
        },
        async itemDrop(
            item: RowItem<PlayQueueItem>,
            index: number,
            evt: DragEvent
        ) {
            const transferData = evt.dataTransfer?.getData(ITEM_STUB_MIME_TYPE);
            item.dragCount = 0;
            this.dragOver = 0;
            this.childDragOver = 0;
            if (transferData) {
                evt.preventDefault();
                const itemStubs = JSON.parse(transferData) as Array<ItemStub>;
                const tracksByItem = await Promise.all(
                    itemStubs.map((item) =>
                        this.libraryManager.getChildTracks(item)
                    )
                );
                let tracks: Array<Track> = [];
                for (const itemTrackList of tracksByItem) {
                    tracks = tracks.concat(itemTrackList);
                }
                this.activeQueue.insert(index, tracks);
            }
            if (this.draggingItems) {
                this.removeItems(this.draggingItems);
                this.draggingItems = [];
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
    top: 1.8em;

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

    & .playlist__track__cell--focused {
        background: $colors-highlight;
        outline: 2px solid white;
    }
}

.playlist__drag-info {
    position: absolute;
    top: -1000px;
    left: -1000px;
    background-color: white;
    color: black;
    max-height: 5em;
    overflow: hidden;
    border-radius: $dims-border-radius-subtle;

    ul {
        list-style-type: none;
    }
}
</style>
