<template>
    <footer id="playback-footer">
        <section class="now-playing" v-if="activeTrack">
            <div class="track-information">
                <span class="track-title">{{ trackName }}</span>
                <span class="artist-title">{{ artistName }}</span>
                <span class="album-title">{{ albumName }}</span>
            </div>
            <div class="playback-information">
                <span class="current-time">{{ formatTime(currentTime) }}</span>
                <span class="duration">{{ formatTime(duration) }}</span>
            </div>
        </section>
        <section class="playback-controls button-group">
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
        <section class="extra-controls button-group">
            <button
                title="Shuffle"
                :class="{ active: shuffle }"
                @click="toggleShuffle"
            >
                <i class="fi-shuffle" title="Shuffle"></i>
            </button>
            <button
                title="Repeat"
                :class="{ active: repeat }"
                @click="toggleRepeat"
            >
                <i class="fi-loop" title="Repeat"></i>
            </button>
        </section>
    </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AudioPlayer, PlaybackEventType } from './player';
import { artistNames } from './library';

export default defineComponent({
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
            repeat: this.player.repeat,
            shuffle: false,
            duration: this.player.activeTrack()?.duration || 0,
            currentTime: 0,
        };
    },
    emits: ['toggle-play'],
    created() {
        this.player.playbackEvent.on((evt) => {
            console.log('Playbck event', evt);
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
                    break;
            }
        });
    },
    computed: {
        trackName(): string {
            const title = this.activeTrack && this.activeTrack.name;

            return title || 'Unknown Track';
        },
        artistName(): string {
            if (this.activeTrack) {
                return artistNames(this.activeTrack);
            } else {
                return 'Unknown Artist';
            }
        },
        albumName(): string {
            const album = this.activeTrack && this.activeTrack.album;
            if (album && album.name) {
                return album.name;
            }
            return 'Unknown Album';
        },
    },
    methods: {
        togglePlay() {
            this.player.togglePlay();
        },
        toggleShuffle() {
            this.shuffle = this.player.shuffle = !this.player.shuffle;
        },
        toggleRepeat() {
            this.repeat = this.player.repeat = !this.player.repeat;
        },
        formatTime(timeValue: number): string {
            const seconds = Math.floor(timeValue % 60);
            const secondString = seconds.toFixed().padStart(2, '0');
            const minutes = Math.floor((timeValue % 3600) / 60);
            const minuteString = minutes.toFixed().padStart(2, '0');
            const hours = Math.floor(timeValue / 3600);

            if (hours >= 1) {
                const hourString = hours.toFixed().padStart(2, '0');
                return `${hourString}:${minuteString}:${secondString}`;
            } else {
                return `${minuteString}:${secondString}`;
            }
        },
        previousTrack() {
            this.player.previousTrack();
        },
        nextTrack() {
            this.player.nextTrack();
        },
    },
});
</script>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playback-footer {
    background-color: $colors-primary;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: 1fr;
    align-items: center;
}

#playback-footer .now-playing {
    padding-left: $dims-padding;
    padding-right: $dims-padding;
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

#playback-footer .button-group {
    display: grid;
    padding: $dims-padding;
    grid-auto-flow: column;
    grid-column-gap: $dims-padding;
    justify-content: center;
}

#playback-footer button {
    font-size: 1.2em;
    background-color: $colors-primary-bright;
    width: 2em;
    height: 2em;
    color: $colors-text;
    border: none;
    border-radius: 50%;

    &:hover {
        border: 2px solid $colors-primary-bright;
        background: transparent;
    }

    &:hover.active {
        background: lighten($colors-primary, 10%);
        color: $colors-text;
    }

    &:active,
    &.active {
        border: 2px solid $colors-primary-bright;
        background: lighten($colors-primary, 50%);
        color: $colors-text-dark;
    }
}

#playback-footer .playback-controls {
    grid-column: 2;
}

#playback-footer .extra-controls {
    justify-content: start;

    button {
        width: 1.5em;
        height: 1.5em;
    }
}
</style>
