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
                    v-for="(track, index) in tracks"
                    :key="track.id"
                    :class="{
                        'playlist__track--selected': track.selected,
                    }"
                    @click.exact="selectItem(track)"
                    @mousedown.ctrl.prevent
                    @mousedown.shift.prevent
                    @click.ctrl.exact.prevent.stop="appendSelectItem(track)"
                    @click.shift.exact.prevent.stop="extendSelectItem(track, index)"
                    @dblclick.prevent.stop="playTrack(index)"
                >
                    <td>{{ track.data.name }}</td>
                    <td>{{ formatAlbumArtists(track.data) }}</td>
                    <td>{{ track.data.album.name }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Track } from './library';
import { AudioPlayer } from './player';
import PlayQueue from './play-queue';

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
        const defaultQueue = new PlayQueue('Default');
        return {
            tracks: [] as Array<RowItem<Track>>,
            playQueues: [defaultQueue],
            activeQueue: defaultQueue,
            selectedItems: [] as Array<RowItem<Track>>,
        };
    },
    created() {
        this.player.setQueue(this.activeQueue);
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
        addTrack(item: Track) {
            this.activeQueue.extend([item]);
            this.tracks.push({
                id: item.id,
                selected: false,
                data: item,
            });
        },
        selectItem(item: RowItem<Track>) {
            this.clearSelection();
            item.selected = true;
            this.selectedItems = [item];
        },
        appendSelectItem(item: RowItem<Track>) {
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
            selectTargetItem: RowItem<Track>,
            targetItemIndex: number
        ) {
            if (this.selectedItems.length === 0) {
                this.selectItem(selectTargetItem);
            } else {
                let firstSelectedIndex = -1;
                for (let i = 0; i < this.tracks.length; i++) {
                    let currentItem = this.tracks[i];
                    if (firstSelectedIndex === -1 && currentItem.selected) {
                        firstSelectedIndex = i;
                    }
                }
                this.clearSelection();
                let startIdx = Math.min(firstSelectedIndex, targetItemIndex);
                let endIdx = Math.max(firstSelectedIndex, targetItemIndex) + 1;
                let newSelection = this.tracks.slice(startIdx, endIdx);

                for (const item of newSelection) {
                    item.selected = true;
                }
                this.selectedItems = newSelection;
            }
        },
        playTrack(index: number) {
            this.player.play(index);
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
