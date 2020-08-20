<template>
    <section id="playback-controls">
        <button>Play</button>
        <button>Pause</button>
        <button>Back</button>
        <button>Next</button>
    </section>
</template>

<style lang="scss">
@import './styles/colors.scss';
@import './styles/dims.scss';

#playback-controls {
    background-color: $colors-primary;
    text-align: center;
    padding: $dims-padding;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
