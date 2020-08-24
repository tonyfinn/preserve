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
        async activateItem(item: LibraryItem) {
            console.log('Activating', item);
            const playlist = this.$refs.playlist as typeof PlayList;
            const tracksToAdd = [];
            if (item.type === 'track') {
                tracksToAdd.push(item);
            } else if (item.type === 'album') {
                const albumTracks = await this.library.getAlbumTracks(item.id);
                for (const track of sorted(albumTracks, sortTracks)) {
                    tracksToAdd.push(track);
                }
            } else if (item.type === 'artist') {
                const albums = await this.library.getArtistAlbums(
                    item.id,
                    false
                );

                const tracksByAlbum = await Promise.all(
                    sorted(albums, sortAlbums).map((album) =>
                        this.library.getAlbumTracks(album.id)
                    )
                );
                for (const albumTracks of tracksByAlbum) {
                    for (const track of albumTracks) {
                        tracksToAdd.push(track);
                    }
                }
            }
            playlist.addTracks(tracksToAdd);
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
