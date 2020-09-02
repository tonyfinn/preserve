<template>
    <div id="playback-screen">
        <music-library
            draggable="true"
            :library="library"
            @activate-item="activateItem"
            @update-selection="updateSelection"
            @dragstart="libraryDragStart"
        ></music-library>
        <play-queues
            :library="library"
            :queueManager="queueManager"
            :player="player"
        ></play-queues>
        <playback-footer :player="player"></playback-footer>
        <div class="drag-counter">
            {{ selectedItems.length }} items selected
        </div>
    </div>
</template>

<script lang="ts">
import MusicLibrary from './library/MusicLibrary.vue';
import { AudioPlayer } from './player';
import { Library, LibraryItem } from './library';
import PlaybackFooter from './PlaybackFooter.vue';
import { PlayQueues, QueueManager } from './queues';
import { defineComponent } from 'vue';
import { TreeActivateEvent } from './tree/tree-item';

export default defineComponent({
    components: {
        MusicLibrary,
        PlaybackFooter,
        PlayQueues,
    },
    props: {
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
        const player = AudioPlayer.getOrCreateInstance(this.library);
        player.setQueue(this.queueManager.getActiveQueue());
        return {
            player,
            selectedItems: [] as Array<LibraryItem>,
        };
    },
    methods: {
        async activateItem(evt: TreeActivateEvent<LibraryItem>) {
            const tracksToAdd = await this.library.getChildTracks(
                evt.item.data
            );
            const newIndex = this.queueManager.activeQueue.size();
            this.queueManager.activeQueue.extend(tracksToAdd);
            const playNow = !evt.shiftKey && !evt.ctrlKey && !evt.altKey;
            if (playNow) {
                this.player.play(newIndex);
            }
        },
        libraryDragStart(evt: DragEvent) {
            if (this.selectedItems.length > 0) {
                const textValues = this.selectedItems
                    .map((item) => `${item.type}: ${item.name}`)
                    .join('\n');
                evt.dataTransfer?.setData('text/plain', textValues);
                const jsonValues = this.selectedItems.map((item) => {
                    return {
                        type: item.type,
                        name: item.name,
                        id: item.id,
                    };
                });
                evt.dataTransfer?.setData(
                    'application/x-preserve-library-item-stub',
                    JSON.stringify(jsonValues)
                );
                const dragEl = this.$el.querySelector('.drag-counter');
                evt.dataTransfer?.setDragImage(dragEl, 10, dragEl.width / 2);
            } else {
                evt.preventDefault();
            }
        },
        updateSelection(selection: Array<LibraryItem>) {
            this.selectedItems = selection;
        },
    },
});
</script>

<style lang="scss">
#playback-screen {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: minmax(25%, 30em) minmax(75%, 1fr);

    .drag-counter {
        position: absolute;
        top: -1000px;
        left: -1000px;
        background-color: white;
        color: black;
        border-radius: 25%;
    }
}

#music-library {
    grid-row: 1;
    grid-column: 1;
}

#playlist {
    grid-row: 1;
    grid-column: 2 / 3;
}

#playback-footer {
    grid-row: 2;
    grid-column: 1 / 3;
}
</style>
