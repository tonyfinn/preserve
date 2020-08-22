<template>
    <section id="playback-controls">
        <button>⏮</button>
        <button v-if="!playing" @click="togglePlay">▶</button>
        <button v-if="playing" @click="togglePlay">⏸</button>
        <button>⏭</button>
    </section>
</template>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playback-controls {
    background-color: $colors-primary;
    text-align: center;
    padding: $dims-padding;
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: $dims-padding;
    justify-content: center;
}

#playback-controls button {
    font-size: 1.2em;
    background-color: $colors-primary-bright;
    width: 2em;
    height: 2em;
    color: white;
    border: none;
    border-radius: 50%;
}

#playback-controls button:hover {
    border: 2px solid $colors-primary-bright;
    background: transparent;
}

#playback-controls button:active {
    border: 2px solid $colors-primary-bright;
    background: lighten($colors-primary, 20%);
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            playing: false,
        };
    },
    methods: {
        togglePlay() {
            this.playing = !this.playing;
        },
    },
});
</script>
