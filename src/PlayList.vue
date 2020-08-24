<template>
    <section id="playlist">
        <table>
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
                    }"
                    @click.exact="selectItem(queueItem)"
                    @mousedown.ctrl.prevent
                    @mousedown.shift.prevent
                    @click.ctrl.exact.prevent.stop="appendSelectItem(queueItem)"
                    @click.shift.exact.prevent.stop="
                        extendSelectItem(queueItem, index)
                    "
                    @dblclick.prevent.stop="playTrack(index)"
                >
                    <td>{{ queueItem.data.track.name }}</td>
                    <td>{{ formatAlbumArtists(queueItem.data.track) }}</td>
                    <td>{{ queueItem.data.track.album.name }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Track } from './library';
import { AudioPlayer } from './player';
import PlayQueue, { PlayQueueItem } from './play-queue';

interface RowItem<T> {
    id: string;
    selected: boolean;
    data: T;
}

export default defineComponent({
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
    },
    data() {
        const defaultQueue = this.player.getQueue();
        return {
            queueItems: [] as Array<RowItem<PlayQueueItem>>,
            playQueues: [defaultQueue],
            activeQueue: defaultQueue,
            selectedItems: [] as Array<RowItem<PlayQueueItem>>,
        };
    },
    created() {
        this.player.setQueue(this.activeQueue);
        window.addEventListener('keydown', this.handleKeyDown);
        this.queueItems = this.rowItemsFromQueue(this.activeQueue);
        this.activeQueue.onChange.on(() => {
            this.queueItems = this.rowItemsFromQueue(this.activeQueue);
        });
    },
    destroyed() {
        window.removeEventListener('keydown', this.handleKeyDown);
    },
    emits: ['play-track'],
    methods: {
        formatAlbumArtists(item: Track) {
            if (item.albumArtists.size === 0) {
                return 'Unknown Artist';
            }
            let albumArtists = [];
            for (const aa of item.albumArtists) {
                albumArtists.push(aa.name);
            }
            return albumArtists.join('; ');
        },
        addTracks(items: Array<Track>) {
            this.activeQueue.extend(items);
        },
        rowItemsFromQueue(queue: PlayQueue): Array<RowItem<PlayQueueItem>> {
            const rowItems = [];
            for (const track of queue) {
                const rowItem = {
                    id: track.queueItemId,
                    selected: false,
                    data: track,
                };
                rowItems.push(rowItem);
            }
            return rowItems;
        },
        selectItem(item: RowItem<PlayQueueItem>) {
            this.clearSelection();
            item.selected = true;
            this.selectedItems = [item];
        },
        appendSelectItem(item: RowItem<PlayQueueItem>) {
            item.selected = true;
            this.selectedItems.push(item);
        },
        clearSelection() {
            for (const selectedItem of this.selectedItems) {
                selectedItem.selected = false;
            }
            this.selectedItems = [];
        },
        extendSelectItem(
            selectTargetItem: RowItem<PlayQueueItem>,
            targetItemIndex: number
        ) {
            if (this.selectedItems.length === 0) {
                this.selectItem(selectTargetItem);
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
            this.player.play(index);
        },
        handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Delete') {
                console.log('Delete pressed');
            }
        },
    },
});
</script>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playlist {
    padding: $dims-padding;
    overflow-y: scroll;
}

#playlist table {
    width: 100%;
    padding: 1em;
    border-collapse: collapse;
}

#playlist table th {
    padding: $dims-padding-dense;
    border-bottom: 1px solid white;
    text-align: left;
}

#playlist table td {
    padding: $dims-padding-dense;
    border: 0;
}

#playlist table tr:nth-child(even) {
    background: $colors-background-alt;
}

#playlist table tbody tr {
    cursor: pointer;

    &.playlist__track--selected {
        background: $colors-selected;
    }

    &:hover {
        background: $colors-highlight;
    }
}
</style>
