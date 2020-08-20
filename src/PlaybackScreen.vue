<template>
    <div id="playback-screen">
        <music-library :library="library"></music-library>
        <play-list></play-list>
        <playback-controls></playback-controls>
    </div>
</template>

<script lang="ts">
import MusicLibrary from './library/MusicLibrary.vue';
import Library from './library/library';
import PlaybackControls from './PlaybackControls.vue';
import PlayList from './PlayList.vue';
import { defineComponent } from 'vue';

export default defineComponent({
    components: {
        MusicLibrary,
        PlaybackControls,
        PlayList,
    },
    props: {
        library: Library,
    },
});
</script>

<style lang="scss">
#playback-screen {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: 30em 1fr;
}

#music-library {
    grid-row: 1;
    grid-column: 1;
}

#playlist {
    grid-row: 1;
    grid-column: 2;
}

#playback-controls {
    grid-row: 2;
    grid-column: 1 / 3;
}
</style>
