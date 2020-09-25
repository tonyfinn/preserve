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
            <column-picker
                v-if="pickingColumns"
                v-model="columns"
            ></column-picker>
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
                    @mousedown.stop.exact="selectItem(queueItem, index)"
                    @mousedown.ctrl.stop.exact="toggleSelectItem(queueItem)"
                    @mousedown.shift.stop.exact="
                        extendSelectItem(queueItem, index)
                    "
                    @dblclick.prevent.stop="playTrack(index)"
                    draggable="true"
                    @dragstart.stop="itemDragStart($event)"
                    @dragend.stop="dragEnd"
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
import { Library, Track, ItemStub } from '../library';
import { QueueManager, PlayQueueItem, PlayQueue } from '.';
import { ITEM_STUB_MIME_TYPE } from '../common/constants';
import { RowItem, ColumnDef, ColumnPicker } from '../common/table';
import { PLAY_QUEUE_COLUMNS } from './columns';

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
            columns: [...PLAY_QUEUE_COLUMNS.map((x) => Object.assign({}, x))],
            pickingColumns: false,
            selectedItems: [] as Array<RowItem<PlayQueueItem>>,
            draggingItems: [] as Array<RowItem<PlayQueueItem>>,
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
        selectItem(item: RowItem<PlayQueueItem>, index: number) {
            this.clearSelection();
            item.selected = true;
            this.selectedItems = [item];
            this.focusItem(index);
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
        removeItems(items: Array<RowItem<PlayQueueItem>>) {
            this.activeQueue.remove(items.map((x) => x.data));
        },
        removeSelectedItems() {
            this.removeItems(this.selectedItems);
            this.selectedItems = [];
        },
        playFocusedItem() {
            this.playTrack(this.focusIndex);
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
                    itemStubs.map((item) => this.library.getChildTracks(item))
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
                    itemStubs.map((item) => this.library.getChildTracks(item))
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
