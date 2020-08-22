<template>
    <div id="playback-screen">
        <music-library :library="library" @activate-item="activateItem"></music-library>
        <play-list ref="playlist"></play-list>
        <playback-controls></playback-controls>
    </div>
</template>

<script lang="ts">
import MusicLibrary from './library/MusicLibrary.vue';
import Library, { LibraryItem } from './library/library';
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
    methods: {
        activateItem(item: LibraryItem) {
            const playlist = this.$refs.playlist as typeof PlayList;
            if (item.type === 'track') {
                playlist.addTrack(item);
            } else if (item.type === 'album') {
                for (const track of item.tracks) {
                    playlist.addTrack(track);
                }
            } else if (item.type === 'artist') {
                for (const album of item.albums) {
                    for (const track of album.tracks) {
                        playlist.addTrack(track);
                    }
                }
            }
        },
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
