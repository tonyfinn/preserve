<template>
    <div
        class="playlist-picker"
        :class="{
            overflowing: overflowAmount > 0,
        }"
        @wheel.prevent.stop="handleWheel"
    >
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
            <li
                class="playlist-picker__playlist embedded-list-button"
                v-if="overflowAmount <= 0"
            >
                <button
                    type="button"
                    @click="newQueue"
                    aria-label="New Play Queue"
                    title="New Play Queue"
                >
                    <i class="fi-plus"></i>
                </button>
            </li>
        </ul>
        <div
            class="floating-controls floating-controls-left"
            v-if="overflowAmount > 0"
        >
            <button
                type="button"
                @click="showPreviousTab"
                aria-label="Show Previous Tab"
                title="Show Previous Tab"
            >
                <i class="fi-arrow-left"></i>
            </button>
        </div>
        <div
            class="floating-controls floating-controls-right"
            v-if="overflowAmount > 0"
        >
            <button
                type="button"
                @click="showNextTab"
                aria-label="Show Next Tab"
                title="Show Next Tab"
            >
                <i class="fi-arrow-right"></i>
            </button>
            <button
                type="button"
                @click="newQueue"
                aria-label="New Play Queue"
                title="New Play Queue"
            >
                <i class="fi-plus"></i>
            </button>
        </div>
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
    mounted() {
        this.determineOverflow();
        window.addEventListener('resize', this.determineOverflow);
    },
    unmounted() {
        window.removeEventListener('resize', this.determineOverflow);
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
            overflowAmount: 0,
        };
    },
    watch: {
        playQueues() {
            this.determineOverflow();
        },
    },
    methods: {
        determineOverflow() {
            nextTick(() => {
                const list = this.$el.querySelector('ul[role="tablist"]');
                const ownWidth = list.getBoundingClientRect().width;
                const childrenWidth = [...list.querySelectorAll('li')]
                    .map((el) => el.getBoundingClientRect().width)
                    .reduce((x, y) => x + y);
                this.overflowAmount = childrenWidth - ownWidth;
            });
        },
        newQueue() {
            const newQueue = this.queueManager.newQueue();
            this.playQueues = this.queueManager.getQueues();
            this.queueManager.setActiveQueue(newQueue);
            nextTick(() => {
                this.$el
                    .querySelector('.playlist-picker__playlist--active')
                    .focus();
            });
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
            this.showTabForQueue(queue);
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
        showTabForQueue(playQueue: PlayQueue) {
            if (this.overflowAmount <= 0) {
                return;
            }
            const tabEl = document.getElementById(`playQueue-${playQueue.id}`);
            if (!tabEl) {
                console.error(
                    "Tried to focus tab that doesn't exist for ",
                    playQueue
                );
                return;
            }
            const tabLeft = tabEl.offsetLeft;
            const tabRight = tabEl.offsetLeft + tabEl?.offsetWidth;

            const list = this.$el.querySelector('ul[role="tablist"]');
            const listWidth = list.offsetWidth;

            if (tabRight - list.scrollLeft > listWidth - 50) {
                list.scrollTo(tabRight - listWidth, 0);
            } else if (tabLeft < list.scrollLeft - 25) {
                list.scrollTo(tabLeft - 25, 0);
            }
        },
        showNextTab() {
            const list = this.$el.querySelector('ul[role="tablist"]');
            const tabs = [...list.querySelectorAll('[role="tab"]')];

            let lastTab = tabs[0];
            for (const tab of tabs) {
                if (
                    tab.offsetLeft + tab.offsetWidth <=
                    list.scrollLeft + list.offsetWidth
                ) {
                    lastTab = tab;
                } else {
                    break;
                }
            }
            const index = Math.min(
                tabs.indexOf(lastTab) + 1,
                this.playQueues.length - 1
            );
            console.log('showing tab', index);
            this.showTabForQueue(this.playQueues[index]);
        },
        showPreviousTab() {
            const list = this.$el.querySelector('ul[role="tablist"]');
            const tabs = [...list.querySelectorAll('[role="tab"]')];

            let lastTab = tabs[0];
            for (const tab of tabs) {
                if (tab.offsetLeft < list.scrollLeft) {
                    lastTab = tab;
                } else {
                    break;
                }
            }
            const index = Math.max(tabs.indexOf(lastTab), 0);
            this.showTabForQueue(this.playQueues[index]);
        },
        handleWheel(evt: WheelEvent) {
            if (this.overflowAmount < 0) {
                return;
            }
            const increase = evt.deltaY * 5;
            const list = this.$el.querySelector('ul[role="tablist"]');
            list.scrollTo(
                Math.max(
                    0,
                    Math.min(
                        this.overflowAmount + 50,
                        list.scrollLeft + increase
                    )
                ),
                0
            );
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

.playlist-picker {
    background-color: $colors-primary;
    height: 1.8em;
    position: sticky;
    top: 0;
    &.overflowing {
        padding-left: 25px;
        padding-right: 50px;
    }

    ul {
        display: flex;
        justify-content: flex-start;
        align-items: stretch;
        overflow-x: hidden;
        height: 100%;
    }

    li {
        background-color: $colors-background-alt;
        padding: $dims-padding-dense $dims-padding;
        border-left: 2px solid $colors-highlight;
        display: grid;
        grid-auto-flow: column;
        grid-gap: $dims-padding;
        justify-content: center;
        color: $colors-text;
        vertical-align: bottom;
        align-items: start;
        cursor: pointer;
        flex-shrink: 0;
    }

    li span {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    &__playlist {
        &--active {
            background-color: $colors-background !important;
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

    .floating-controls {
        position: absolute;
        top: 0;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-auto-flow: column;

        &.floating-controls-right {
            border-left: 2px solid $colors-highlight;
            right: 0;
        }

        &.floating-controls-left {
            border-right: 2px solid $colors-highlight;
            left: 0;
        }

        & > button {
            height: 100%;
            border-radius: 0;
            border-width: 0 2px;
            background-color: $colors-background;
            padding: $dims-padding-dense $dims-padding;
        }
    }
}
</style>
