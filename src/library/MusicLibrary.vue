<template>
    <section id="music-library">
        <div class="search-controls">
            <input type="text" v-model="searchText" placeholder="Search your library" />
        </div>
        <psv-tree v-if="loaded" class="library-tree" @toggleExpand="toggleExpand" :items="treeItems"></psv-tree>
        <p v-if="!loaded">
            Loading...
        </p>
    </section>    
</template>

<script>
import Library from './library';
import PsvTree from '../tree/PsvTree.vue';

function treeViewFromLibrary(libraryTree, searchText='') {
    console.time('buildLibraryTree');
    console.time('filterTree');
    let tree = libraryTree
        .filter(artist => artist.name.toLowerCase().includes(searchText.toLowerCase()));
    console.timeEnd('filterTree');
    console.time('mapToTree');
    tree = tree.map(artist => ({
            id: artist.id,
            name: artist.name,
            isLeaf: false,
            expanded: artist.expanded,
            data: artist,
            children: artist.albums.map(album => ({
                id: album.id,
                name: album.name,
                isLeaf: false,
                expanded: album.expanded,
                data: album,
                children: album.tracks.map(track => ({
                    track: track.id,
                    name: track.name,
                    isLeaf: true,
                    data: track,
                })).sort((a, b) => {
                    const aDisc = a.data.discNumber || -1;
                    const bDisc = b.data.discNumber || -1;
                    const aTrack = a.data.trackNumber || -1;
                    const bTrack = b.data.trackNumber || -1;

                    
                    if (aDisc - bDisc != 0) {
                        return aDisc - bDisc;
                    }

                    if (aTrack - bTrack != 0) {
                        return aTrack - bTrack;
                    }

                    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
                })
            })).sort((a, b) => {
                const aYear = a.data.year;
                const bYear = b.data.year;

                if (aYear - bYear != 0) {
                    return aYear - bYear;
                } else {
                    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
                }
            }),
        }));
    console.timeEnd('mapToTree');
    console.timeEnd('buildLibraryTree');
    return tree;
}

export default {
    components: {PsvTree},
    data() {
        return {
            searchText: '',
            artists: [],
            treeItems: [],
            loaded: false,
            selectedItems: [],
        }
    },
    props: {
        library: Library,
    },
    methods: {
        toggleExpand(item) {
            console.log(item);
            item.expanded = !item.expanded;
        },
        toggleSelect(item) {
            console.log(item);
            item.selected = !item.selected;
        },
    },
    async created() {
        const albumArtists = await this.library.getAlbumArtists();
        const albums = await this.library.getAlbums();
        const tracks = await this.library.getTracks();


        const albumArtistLookup = {};
        const albumLookup = {};

        const libraryTree = [];

        for (const albumArtist of albumArtists) {
            const aa = Object.assign({
                albums: [],
                expanded: false,
                selected: false,
            }, albumArtist);
            albumArtistLookup[aa.id] = aa;
            aa.albums = [];
            libraryTree.push(aa);
        }

        for (const album of albums) {
            const al = Object.assign({
                tracks: [],
                expanded: false,
                selected: false,
            }, album);
            albumLookup[al.id] = al;
            for(const albumArtist of al.albumArtists) {
                const aa = albumArtistLookup[albumArtist.id];
                if (!aa) {
                    console.warn("Could not find album artist %s (%s)", albumArtist.id, albumArtist.name);
                } else {
                    aa.albums.push(al);
                }
            }
        }

        for (const track of tracks) {
            const t = Object.assign({}, track);
            const album = albumLookup[t.album.id];
            if (!album) {
                console.warn("Could not find album %s (%s)", t.album.id, t.album.name);
            } else {
                album.tracks.push(t);
            }
        }

        this.treeItems = treeViewFromLibrary(libraryTree);
        this.loaded = true;
    }
}
</script>

<style lang="scss">
    @import "../styles/colors.scss";
    @import "../styles/dims.scss";

    #music-library {
        padding: $dims-padding;
        display: grid;
        grid-template-rows: auto 1fr;
    }

    .search-controls {
        width: 100%;
        margin-bottom: $dims-padding;
    }

    .search-controls input {
        width: 100%;
    }

    #music-library > .psv-tree {
        overflow-y: auto;
    }
</style>