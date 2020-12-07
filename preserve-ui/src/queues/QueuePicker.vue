<template>
    <div class="playlist-picker">
        <ul role="tablist" aria-label="Play Queues">
            <li
                role="tab"
                v-for="playQueue in playQueues"
                aria-controls="active-play-queue-panel"
                :id="'playQueue-' + playQueue.id"
                :key="playQueue.id"
                :aria-labelledby="'playQueue-' + activeQueue.id + '-name'"
                :aria-selected="isActiveQueue(playQueue)"
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
                @keydown.delete.stop="deleteQueue(playQueue)"
                @keydown.left.stop="activatePreviousQueue()"
                @keydown.right.stop="activateNextQueue()"
                @keydown.home.stop="activateQueue(0)"
                @keydown.end.stop="activateQueue(playQueues.length - 1)"
                @dblclick="rename(playQueue)"
                :tabindex="isActiveQueue(playQueue) ? 0 : -1"
            >
                <span
                    v-if="!isRenaming(playQueue)"
                    :id="'playQueue-' + playQueue.id + '-name'"
                >
                    {{ playQueue.name }}
                </span>
                <input
                    :id="'playQueue-' + playQueue.id + '-name'"
                    type="text"
                    v-model="newName"
                    v-if="isRenaming(playQueue)"
                    @keydown.enter.stop="applyRename"
                    @keydown.escape.stop="cancelRename"
                    @keydown.delete.stop
                    @keydown.left.stop
                    @keydown.right.stop
                    @keydown.home.stop
                    @keydown.end.stop
                />
                <button
                    type="button"
                    title="Rename"
                    aria-label="Rename"
                    tabindex="-1"
                    @click.stop="rename(playQueue)"
                    @keydown.enter.stop="rename(playQueue)"
                >
                    <i class="fi-pencil"></i>
                </button>
                <button
                    type="button"
                    tabindex="-1"
                    v-if="playQueues.length > 1"
                    title="Delete"
                    aria-label="Delete"
                    @click.stop="deleteQueue(playQueue)"
                    @keydown.enter.stop="deleteQueue(playQueue)"
                >
                    <i class="fi-x-circle"></i>
                </button>
            </li>
        </ul>
        <button
            type="button"
            @click="newQueue"
            aria-label="New Play Queue"
            title="New Play Queue"
        >
            <i class="fi-plus"></i>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
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
            nextTick(() => {
                const input = document.getElementById(
                    `playQueue-${queue.id}-name`
                ) as HTMLInputElement;
                input.focus();
                input.selectionStart = 0;
                input.selectionEnd = input.value.length - 1;
            });
        },
        applyRename() {
            if (this.renamingQueue) {
                this.renamingQueue.name = this.newName;
            }
            this.renamingQueue = null;
            this.queueManager.saveQueues();
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
                this.queueManager.deleteQueue(queue);
                this.playQueues = this.queueManager.getQueues();
                if (this.player.getQueue().id === queue.id) {
                    this.player.stop();
                    this.player.setQueue(this.playQueues[0]);
                }
                if (queue.id === activeQueueId) {
                    this.activateQueue(0);
                }
            }
        },
        activateQueue(index: number) {
            this.showQueue(this.playQueues[index]);
            this.$el
                .querySelector(`[role=tab]:nth-child(${index + 1}`)
                .focus({ preventScroll: true });
        },
        activatePreviousQueue() {
            if (this.playQueues.length <= 1) {
                return;
            }
            const nextQueueIndex =
                this.playQueues.indexOf(this.activeQueue) - 1;
            const focusedIndex =
                nextQueueIndex < 0
                    ? this.playQueues.length - 1
                    : nextQueueIndex;
            this.activateQueue(focusedIndex);
        },
        activateNextQueue() {
            if (this.playQueues.length <= 1) {
                return;
            }
            const nextQueueIndex =
                this.playQueues.indexOf(this.activeQueue) + 1;
            const focusedIndex =
                nextQueueIndex > this.playQueues.length ? 0 : nextQueueIndex;
            this.activateQueue(focusedIndex);
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
        align-items: start;
        cursor: pointer;
    }

    &__playlist {
        &--active {
            border-bottom-color: $colors-background !important;
        }
        &--playing {
            font-weight: bold;
            font-style: italic;
        }

        button {
            border: 0;
            padding: 0;
            background: transparent;
            color: $colors-text;
            cursor: pointer;
        }
    }
}
</style>
