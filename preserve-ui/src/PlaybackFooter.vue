<template>
    <footer id="playback-footer" aria-label="Music Player">
        <section class="scrubber" v-if="playing">
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
                    <span
                        data-testid="nowplaying-track"
                        class="track-title"
                        :title="trackName"
                        >{{ trackName }}</span
                    >
                    <span
                        data-testid="nowplaying-artist"
                        class="artist-title"
                        :title="artistName"
                        >{{ artistName }}</span
                    >
                    <span
                        data-testid="nowplaying-album"
                        class="album-title"
                        :title="albumName"
                        >{{ albumName }}</span
                    >
                </div>
                <div class="playback-information">
                    <span
                        data-testid="nowplaying-current-time"
                        class="current-time"
                        >{{ formatTime(currentTime) }}</span
                    >
                    <span data-testid="nowplaying-duration" class="duration">{{
                        formatTime(duration)
                    }}</span>
                </div>
            </section>
            <section
                class="playback-controls button-group"
                aria-label="Playback Controls"
            >
                <button
                    title="Previous Track"
                    aria-label="Previous Track"
                    @click="previousTrack"
                >
                    <i class="fi-previous" title="Previous Track"></i>
                </button>
                <button
                    title="Play"
                    aria-label="Play"
                    v-if="!playing"
                    @click="togglePlay"
                >
                    <i class="fi-play" title="Play"></i>
                </button>
                <button
                    title="Pause"
                    aria-label="Pause"
                    v-if="playing"
                    @click="togglePlay"
                >
                    <i class="fi-pause" title="Pause"></i>
                </button>
                <button
                    title="Next Track"
                    aria-label="Next Track"
                    @click="nextTrack"
                >
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
                        aria-label="Shuffle"
                        role="switch"
                        :aria-checked="isShuffling()"
                        :class="{ active: isShuffling() }"
                        @click="toggleShuffle"
                    >
                        <i class="fi-shuffle" title="Shuffle"></i>
                    </button>
                    <button
                        title="Repeat"
                        data-testid="repeat-button"
                        role="checkbox"
                        :aria-checked="
                            isRepeatOne()
                                ? 'mixed'
                                : isRepeat()
                                ? 'true'
                                : 'false'
                        "
                        :aria-label="repeatModeLabel"
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
                        <button @click="toggleMute" :aria-pressed="muted">
                            Mute
                        </button>
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
import {
    AudioPlayer,
    PlaybackEventType,
    RepeatMode,
    ShuffleMode,
} from './player';
import { artistNames } from './library';
import SliderBar from './common/SliderBar.vue';
import { formatTime } from './common/utils';
import {
    UNKNOWN_ARTIST_NAME,
    UNKNOWN_ALBUM_NAME,
    UNKNOWN_TRACK_NAME,
} from './common/constants';
import { Settings } from './common/settings';

export default defineComponent({
    components: { SliderBar },
    props: {
        player: {
            type: AudioPlayer,
            required: true,
        },
        settings: {
            type: Settings,
            required: true,
        },
    },
    data() {
        return {
            activeTrack: this.player.activeTrack(),
            playing: this.player.playing,
            repeatMode: this.player.repeatMode,
            shuffleMode: this.player.shuffleMode,
            muted: false,
            scrubbing: false,
            duration: this.player.activeTrack()?.duration || 0,
            currentTime: 0,
            scrubberTime: 0,
            volume: this.player.volume * 100,
        };
    },
    watch: {
        volume(newValue) {
            const bounded = Math.min(100, Math.max(newValue, 0));
            this.player.setVolume(bounded / 100);
            this.settings.set('volume', bounded / 100);
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
        repeatModeLabel(): string {
            switch (this.repeatMode) {
                case RepeatMode.Off:
                    return 'Repeat: Off';
                case RepeatMode.Repeat:
                    return 'Repeat: All';
                case RepeatMode.RepeatOne:
                    return 'Repeat: One';
                default:
                    return 'Repeat';
            }
        },
    },
    methods: {
        togglePlay() {
            this.player.togglePlay();
        },
        toggleShuffle() {
            this.shuffleMode = this.player.toggleShuffle();
            this.settings.set('shuffleMode', this.shuffleMode);
        },
        toggleRepeat() {
            this.repeatMode = this.player.nextRepeatMode();
            this.settings.set('repeatMode', this.repeatMode);
        },
        toggleMute() {
            this.muted = this.player.toggleMute();
        },
        isShuffling() {
            return this.shuffleMode === ShuffleMode.Shuffle;
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
