<template>
    <div class="playlist-picker">
        <ul>
            <li
                v-for="playQueue in playQueues"
                :key="playQueue.id"
                :class="{
                    'playlist-picker__playlist': true,
                    'playlist-picker__playlist--active':
                        playQueue.id === activeQueue.id,
                }"
                @click="showQueue(playQueue)"
                @keydown.enter.stop="showQueue(playQueue)"
                @keydown.f2.stop="renamingQueueId = playQueue.id"
                @dblclick="renamingQueueId = playQueue.id"
                tabindex="0"
            >
                <span v-if="renamingQueueId != playQueue.id">
                    {{ playQueue.name }}
                </span>
                <input
                    type="text"
                    v-model="playQueue.name"
                    v-if="renamingQueueId === playQueue.id"
                    @keydown.enter.stop="renamingQueueId = -1"
                    @keydown.escape.stop="renamingQueueId = -1"
                />
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

export default defineComponent({
    props: {
        queueManager: {
            type: QueueManager,
            required: true,
        },
    },
    data() {
        return {
            playQueues: this.queueManager.getQueues(),
            activeQueue: this.queueManager.getActiveQueue(),
            renamingQueueId: -1,
        };
    },
    methods: {
        newQueue() {
            const newQueue = this.queueManager.newQueue();
            this.playQueues = this.queueManager.getQueues();
            this.activeQueue = newQueue;
        },
        showQueue(queue: PlayQueue) {
            this.queueManager.setActiveQueue(queue);
            this.activeQueue = queue;
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
    button {
        background-color: $colors-background;
        padding: $dims-padding-dense $dims-padding;
        border: 2px solid $colors-highlight;
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: $colors-text;
        vertical-align: bottom;
    }

    &__playlist {
        &--active {
            border-bottom-color: $colors-background !important;
        }
    }
}
</style>
