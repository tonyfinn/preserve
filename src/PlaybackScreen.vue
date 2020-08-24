<template>
    <div id="playback-screen">
        <music-library
            :library="library"
            @activate-item="activateItem"
        ></music-library>
        <play-list ref="playlist" :player="player"></play-list>
        <playback-footer :player="player"></playback-footer>
    </div>
</template>

<script lang="ts">
import MusicLibrary from './library/MusicLibrary.vue';
import { AudioPlayer } from './player';
import { Library, LibraryItem, sortAlbums, sortTracks } from './library';
import PlaybackFooter from './PlaybackFooter.vue';
import PlayList from './PlayList.vue';
import { defineComponent } from 'vue';
import { sorted } from './common/utils';

export default defineComponent({
    components: {
        MusicLibrary,
        PlaybackFooter,
        PlayList,
    },
    props: {
        library: {
            type: Library,
            required: true,
        },
    },
    data() {
        return {
            player: AudioPlayer.getOrCreateInstance(this.library),
        };
    },
    methods: {
        activateItem(item: LibraryItem) {
            console.log('Activating', item);
            const playlist = this.$refs.playlist as typeof PlayList;
            const tracks = [];
            if (item.type === 'track') {
                playlist.addTrack(item);
                tracks.push(item);
            } else if (item.type === 'album') {
                for (const track of sorted(item.tracks, sortTracks)) {
                    tracks.push(track);
                }
            } else if (item.type === 'artist') {
                for (const album of sorted(item.albums, sortAlbums)) {
                    for (const track of sorted(album.tracks, sortTracks)) {
                        tracks.push(track);
                    }
                }
            }
            playlist.addTracks(tracks);
        },
    },
});
</script>

<style lang="scss">
#playback-screen {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: minmax(25%, 30em) minmax(75%, 1fr);
}

#music-library {
    grid-row: 1;
    grid-column: 1;
}

#playlist {
    grid-row: 1;
    grid-column: 2;
}

#playback-footer {
    grid-row: 2;
    grid-column: 1 / 3;
}
</style>
