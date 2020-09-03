<template>
    <div class="playlist-picker">
        <ul>
            <li
                v-for="playQueue in playQueues"
                :key="playQueue.id"
                :class="{
                    'playlist-picker__playlist': true,
                    'playlist-picker__playlist--active': isActiveQueue(
                        playQueue
                    ),
                    'playlist-picker__playlist--playing': isPlayingQueue(
                        playQueue
                    ),
                }"
                @click="showQueue(playQueue)"
                @keydown.enter.stop="showQueue(playQueue)"
                @keydown.f2.stop="rename(playQueue)"
                @dblclick="rename(playQueue)"
                tabindex="0"
            >
                <span v-if="!isRenaming(playQueue)">
                    {{ playQueue.name }}
                </span>
                <input
                    type="text"
                    v-model="newName"
                    v-if="isRenaming(playQueue)"
                    @keydown.enter.stop="applyRename"
                    @keydown.escape.stop="cancelRename"
                />
                <i
                    class="fi-pencil"
                    title="Rename Play Queue"
                    tabindex="0"
                    @click.stop="rename(playQueue)"
                    @keydown.enter.stop="rename(playQueue)"
                ></i>
                <i
                    class="fi-x-circle"
                    title="Delete Play Queue"
                    tabindex="0"
                    v-if="playQueues.length > 1"
                    @click.stop="deleteQueue(playQueue)"
                    @keydown.enter.stop="deleteQueue(playQueue)"
                ></i>
            </li>
        </ul>
        <button type="button" @click="newQueue">
            <i class="fi-plus"></i>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { QueueManager, PlayQueue } from './play-queue';
import { AudioPlayer } from '../player';

export default defineComponent({
    props: {
        queueManager: {
            type: QueueManager,
            required: true,
        },
        player: {
            type: AudioPlayer,
            required: true,
        },
    },
    created() {
        this.queueManager.onSwitchActive.on((evt) => {
            this.activeQueue = evt.newQueue;
        });
        this.player.onQueueChange.on((evt) => {
            this.playingQueue = evt.newQueue;
        });
    },
    data() {
        const playingQueue = this.player.getQueue();
        return {
            playQueues: this.queueManager.getQueues(),
            activeQueue: this.queueManager.getActiveQueue(),
            playingQueue,
            renamingQueue: null as PlayQueue | null,
            actionsShownQueue: null as PlayQueue | null,
            newName: '',
        };
    },
    methods: {
        newQueue() {
            const newQueue = this.queueManager.newQueue();
            this.playQueues = this.queueManager.getQueues();
            this.queueManager.setActiveQueue(newQueue);
        },
        rename(queue: PlayQueue) {
            this.renamingQueue = queue;
            this.newName = queue.name;
        },
        applyRename() {
            if (this.renamingQueue) {
                this.renamingQueue.name = this.newName;
            }
            this.renamingQueue = null;
        },
        cancelRename() {
            this.renamingQueue = null;
        },
        isRenaming(queue: PlayQueue) {
            return this.renamingQueue && this.renamingQueue.id === queue.id;
        },
        isActiveQueue(queue: PlayQueue) {
            return queue.id === this.activeQueue.id;
        },
        isPlayingQueue(queue: PlayQueue) {
            return queue.id === this.playingQueue.id;
        },
        showQueue(queue: PlayQueue) {
            this.queueManager.setActiveQueue(queue);
        },
        deleteQueue(queue: PlayQueue) {
            if (
                queue.size() === 0 ||
                window.confirm(
                    `Are you sure you want to delete "${queue.name}"?`
                )
            ) {
                const activeQueueId = this.activeQueue.id;
                if (this.player.getQueue().id === queue.id) {
                    this.player.stop();
                    this.player.setQueue(this.activeQueue);
                }
                this.queueManager.deleteQueue(queue);
                this.playQueues = this.queueManager.getQueues();
                if (queue.id === activeQueueId) {
                    const newActiveQueue = this.playQueues[0];
                    this.queueManager.setActiveQueue(newActiveQueue);
                }
            }
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

.playlist-picker {
    background-color: $colors-primary;
    height: 2em;
    position: sticky;
    top: 0;

    display: grid;
    grid-auto-flow: column;
    justify-content: start;
    align-items: stretch;

    ul {
        display: contents;
    }

    li,
    & > button {
        background-color: $colors-background;
        padding: $dims-padding-dense $dims-padding;
        border: 2px solid $colors-highlight;
        display: grid;
        grid-auto-flow: column;
        grid-gap: $dims-padding;
        justify-content: center;
        color: $colors-text;
        vertical-align: bottom;
    }

    &__playlist {
        &--active {
            border-bottom-color: $colors-background !important;
        }
        &--playing {
            font-weight: bold;
            font-style: italic;
        }
    }
}
</style>
