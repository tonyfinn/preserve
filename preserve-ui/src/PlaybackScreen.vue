<template>
    <div id="playback-screen">
        <music-library
            draggable="true"
            :libraryManager="libraryManager"
            :settings="settings"
            @activate-item="activateItem"
            @update-selection="updateSelection"
            @dragstart="libraryDragStart"
        ></music-library>
        <play-queues
            :libraryManager="libraryManager"
            :queueManager="queueManager"
            :player="player"
            :settings="settings"
        ></play-queues>
        <playback-footer :player="player"
            :settings="settings"></playback-footer>
        <div class="drag-counter">
            {{ selectedItems.length }} items selected
        </div>
    </div>
</template>

<script lang="ts">
import { ITEM_STUB_MIME_TYPE } from './common/constants';
import MusicLibrary from './library/MusicLibrary.vue';
import { AudioPlayer } from './player';
import { LibraryItem, LibraryManager } from './library';
import { Settings } from './common/settings';
import PlaybackFooter from './PlaybackFooter.vue';
import { PlayQueues, QueueManager } from './queues';
import { defineComponent } from 'vue';
import { TreeActivateEvent } from './common/tree/tree-item';

export default defineComponent({
    components: {
        MusicLibrary,
        PlaybackFooter,
        PlayQueues,
    },
    props: {
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
        const player = AudioPlayer.getOrCreateInstance(this.libraryManager);
        player.setQueue(this.queueManager.getActiveQueue());
        player.setVolume(this.settings.volume);
        player.setRepeatMode(this.settings.repeatMode);
        player.setShuffleMode(this.settings.shuffleMode);
        return {
            player,
            selectedItems: [] as Array<LibraryItem>,
        };
    },
    methods: {
        async activateItem(evt: TreeActivateEvent<LibraryItem>) {
            const tracksToAdd = await this.libraryManager.getChildTracks(
                evt.item.data
            );
            const newIndex = this.queueManager.activeQueue.size();
            this.queueManager.activeQueue.extend(tracksToAdd);
            const playNow = !evt.shiftKey && !evt.ctrlKey && !evt.altKey;
            if (playNow) {
                this.player.setQueue(this.queueManager.activeQueue);
                this.player.play(newIndex);
            }
            this.queueManager.saveQueues();
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
                    ITEM_STUB_MIME_TYPE,
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
@import './styles/dims.scss';

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
        border-radius: $dims-border-radius-subtle;
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
