<template>
    <footer id="playback-footer" aria-label="Music Player">
        <section class="scrubber">
            <div class="gui-scrubber">
                <SliderBar
                    :modelValue="scrubberTime"
                    @update:modelValue="scrubTo"
                    :min="0"
                    :max="duration"
                ></SliderBar>
            </div>
        </section>
        <section class="main-footer">
            <section
                class="now-playing"
                v-if="activeTrack"
                aria-label="Track Information"
            >
                <div class="track-information">
                    <span class="track-title" :title="trackName">{{
                        trackName
                    }}</span>
                    <span class="artist-title" :title="artistName">{{
                        artistName
                    }}</span>
                    <span class="album-title" :title="albumName">{{
                        albumName
                    }}</span>
                </div>
                <div class="playback-information">
                    <span class="current-time">{{
                        formatTime(currentTime)
                    }}</span>
                    <span class="duration">{{ formatTime(duration) }}</span>
                </div>
            </section>
            <section
                class="playback-controls button-group"
                aria-label="Playback Controls"
            >
                <button title="Previous Track" @click="previousTrack">
                    <i class="fi-previous" title="Previous Track"></i>
                </button>
                <button title="Play" v-if="!playing" @click="togglePlay">
                    <i class="fi-play" title="Play"></i>
                </button>
                <button title="Pause" v-if="playing" @click="togglePlay">
                    <i class="fi-pause" title="Pause"></i>
                </button>
                <button title="Next Track" @click="nextTrack">
                    <i class="fi-next" title="Next Track"></i>
                </button>
            </section>
            <div class="after-playback-controls">
                <section
                    class="extra-controls button-group"
                    aria-label="Playback Modes"
                >
                    <button
                        title="Shuffle"
                        :class="{ active: shuffle }"
                        @click="toggleShuffle"
                    >
                        <i class="fi-shuffle" title="Shuffle"></i>
                    </button>
                    <button
                        title="Repeat"
                        :class="{ active: isRepeat() }"
                        @click="toggleRepeat"
                    >
                        <i
                            class="fi-loop"
                            title="Repeat"
                            v-if="!isRepeatOne()"
                        ></i>
                        <span v-if="isRepeatOne()">1</span>
                    </button>
                </section>
                <section class="volume-controls" aria-label="Volume Control">
                    <div class="sr-volume sr-only">
                        <label for="player-volume">Volume:</label>
                        <input
                            type="number"
                            name="player-volume"
                            class="volume-input-number"
                            v-model="volume"
                            min="0"
                            max="100"
                        />
                    </div>
                    <div class="gui-volume">
                        <i
                            :class="{
                                'fi-volume': !muted && volume > 0,
                                'fi-volume-none': !muted && volume === 0,
                                'fi-volume-strike': muted,
                            }"
                            @click="toggleMute"
                        ></i>
                        <SliderBar v-model="volume"></SliderBar>
                    </div>
                </section>
            </div>
        </section>
    </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AudioPlayer, PlaybackEventType, RepeatMode } from './player';
import { artistNames } from './library';
import SliderBar from './common/SliderBar.vue';
import { formatTime } from './common/utils';
import {
    UNKNOWN_ARTIST_NAME,
    UNKNOWN_ALBUM_NAME,
    UNKNOWN_TRACK_NAME,
} from './common/constants';

export default defineComponent({
    components: { SliderBar },
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
    },
    data() {
        return {
            activeTrack: this.player.activeTrack(),
            playing: this.player.playing,
            repeatMode: this.player.repeatMode,
            shuffle: false,
            muted: false,
            scrubbing: false,
            duration: this.player.activeTrack()?.duration || 0,
            currentTime: 0,
            scrubberTime: 0,
            volume: 100,
        };
    },
    watch: {
        volume(newValue) {
            const bounded = Math.min(100, Math.max(newValue, 0));
            this.player.setVolume(bounded / 100);
            this.muted = this.player.muted;
        },
    },
    emits: ['toggle-play'],
    created() {
        this.player.playbackEvent.on((evt) => {
            switch (evt.type) {
                case PlaybackEventType.Play:
                    this.playing = true;
                    this.activeTrack = evt.track;
                    this.currentTime = 0;
                    this.duration = evt.track.duration;
                    break;
                case PlaybackEventType.Resume:
                    this.playing = true;
                    break;
                case PlaybackEventType.Pause:
                    this.playing = false;
                    break;
                case PlaybackEventType.End:
                    this.playing = false;
                    this.activeTrack = null;
                    this.currentTime = 0;
                    this.duration = 0;
                    break;
                case PlaybackEventType.Time:
                    this.currentTime = evt.time;
                    this.scrubberTime = evt.time;
                    break;
            }
        });
    },
    computed: {
        trackName(): string {
            const title = this.activeTrack && this.activeTrack.name;

            return title || UNKNOWN_TRACK_NAME;
        },
        artistName(): string {
            if (this.activeTrack) {
                return artistNames(this.activeTrack);
            } else {
                return UNKNOWN_ARTIST_NAME;
            }
        },
        albumName(): string {
            const album = this.activeTrack && this.activeTrack.album;
            if (album && album.name) {
                return album.name;
            }
            return UNKNOWN_ALBUM_NAME;
        },
    },
    methods: {
        togglePlay() {
            this.player.togglePlay();
        },
        toggleShuffle() {
            this.shuffle = this.player.toggleShuffle();
        },
        toggleRepeat() {
            this.repeatMode = this.player.nextRepeatMode();
        },
        toggleMute() {
            this.muted = this.player.toggleMute();
        },
        isRepeat() {
            return this.repeatMode !== RepeatMode.Off;
        },
        isRepeatOne() {
            return this.repeatMode === RepeatMode.RepeatOne;
        },
        formatTime(timeValue: number): string {
            return formatTime(timeValue);
        },
        previousTrack() {
            this.player.previousTrack();
        },
        nextTrack() {
            this.player.nextTrack();
        },
        scrubTo(newValue: number) {
            this.scrubberTime = newValue;
            this.player.setTime(newValue);
        },
    },
});
</script>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playback-footer > .main-footer {
    background-color: $colors-primary;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: 1fr;
    align-items: center;
    padding: $dims-padding;
    grid-gap: $dims-padding;

    .now-playing {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-auto-flow: column;

        .track-title {
            display: block;
        }

        .artist-title:after {
            content: ' - ';
        }

        .playback-information {
            margin: auto;
        }

        .current-time:after {
            content: ' / ';
        }
    }

    .button-group {
        display: grid;
        grid-auto-flow: column;
        grid-column-gap: $dims-padding;
        justify-content: center;
    }

    button {
        font-size: 1.2em;
        width: 2em;
        height: 2em;
        border-radius: 50%;
        padding: 0;
        border: 2px solid transparent;

        &:hover,
        &:active,
        &.active {
            border: 2px solid $colors-primary-bright;
        }
    }

    .playback-controls {
        grid-column: 2;
    }

    .after-playback-controls {
        display: grid;
        grid-auto-flow: column;
        justify-content: space-between;
        align-items: center;

        button {
            padding: 0;
        }
    }

    .extra-controls {
        justify-content: start;

        button {
            width: 1.5em;
            height: 1.5em;
        }
    }

    .volume-input-number {
        width: 6em;
    }
}

#playback-footer .scrubber {
    .slider {
        height: 0.3em;
        border: 0;

        &:hover {
            height: 1em;
        }
    }
}

#playback-footer .gui-volume {
    display: grid;
    grid-auto-flow: column;
    grid-gap: $dims-padding;
    align-items: center;

    i::before {
        line-height: inherit;
    }
    .slider {
        width: 5em;
        height: 1.2em;
        border: 0;

        .slider-highlight-wrapper {
            clip-path: polygon(0 100%, 100% 0, 100% 100%);
        }
    }
}
</style>
