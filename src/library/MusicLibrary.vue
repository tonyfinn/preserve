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
import { debounced } from '../common/utils';
import PsvTree from '../tree/PsvTree.vue';


function sortTracks(a, b) {
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
}

function sortAlbums(a, b) {
    const aYear = a.data.year;
    const bYear = b.data.year;

    if (aYear - bYear != 0) {
        return aYear - bYear;
    } else {
        return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    }
}

function artistTreeNode(artist, searchRegex) {
    const children = [];
    let childMatch = false;
    const ownMatch = !searchRegex || searchRegex.test(artist.name);

    for (const album of artist.albums) {
        const albumNode = albumTreeNode(artist, album, ownMatch, searchRegex);
        children.push(albumNode);
        if(albumNode.visible) {
            childMatch = true;
        }
    }

    children.sort(sortAlbums);

    return {
        id: artist.id,
        name: artist.name,
        isLeaf: false,
        expanded: artist.expanded,
        data: artist,
        visible: ownMatch || childMatch,
        children,
    };
}

function albumTreeNode(artist, album, parentMatch, searchRegex) {
    const children = [];
    let childMatch = false;
    const ownMatch = !searchRegex || searchRegex.test(album.name);
    for (const track of album.tracks) {
        const trackNode = trackTreeNode(artist, album, track, parentMatch || ownMatch, searchRegex);
        children.push(trackNode);
        if(trackNode.visible) {
            childMatch = true;
        }
    }

    children.sort(sortTracks);
    
    return {
        id: album.id,
        name: album.name,
        isLeaf: false,
        expanded: album.expanded,
        data: album,
        visible: parentMatch || ownMatch || childMatch,
        children: children,
    };
}

function trackTreeNode(artist, album, track, parentMatch, searchRegex) {
    return {
        track: track.id,
        name: track.name,
        isLeaf: true,
        data: track,
        visible: parentMatch || !searchRegex || searchRegex.test(track.name),
    };
}

function treeViewFromLibrary(libraryTree, searchRegex) {
    console.time('buildLibraryTree');
    let tree = libraryTree.map(artist => artistTreeNode(artist, searchRegex));
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
    watch: {
        searchText(newText) {
            this.updateTreeView(this.libraryTree, newText.trim());
        }
    },
    props: {
        library: Library,
    },
    methods: {
        updateTreeView: debounced(function (libraryTree, searchText) {
            const trimmedText = searchText.trim();
            const emptySearch = trimmedText === '';
            this.treeItems = treeViewFromLibrary(libraryTree, emptySearch ? null : new RegExp(trimmedText, "i"));
        }),
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
        const [artists, albums, tracks] = await Promise.all([
            this.library.getArtists(), 
            this.library.getAlbums(), 
            this.library.getTracks()
        ]);

        const artistLookup = {};
        const looseArtistLookup = {};
        
        const albumLookup = {};
        const looseAlbumLookup = {};

        const libraryTree = [];

        for (const artist of artists) {
            const artistNode = Object.assign({
                albums: new Set(),
                filteredAlbums: new Set(),
                expanded: false,
                selected: false,
                visible: true,
            }, artist);
            if(artist.id) {
                artistLookup[artist.id] = artistNode;
            } else {
                looseArtistLookup[artist.name] = artistNode;
            }
            libraryTree.push(artistNode);
        }

        for (const album of albums) {
            const albumNode = Object.assign({
                tracks: new Set(),
                expanded: false,
                selected: false,
                visible: true,
            }, album);

            if(album.id) {
                albumLookup[album.id] = albumNode;
            } else {
                looseAlbumLookup[album.name] = albumNode;
            }

            for(const albumArtist of album.albumArtists) {
                const aa = artistLookup[albumArtist.id] || looseArtistLookup[albumArtist.name];
                if (!aa) {
                    console.warn("Could not find album artist %s (%s)", albumArtist.id, albumArtist.name);
                } else {
                    aa.albums.add(albumNode);
                }
            }
        }

        for (const track of tracks) {
            const t = Object.assign({
                visible: true,
                selected: false,
            }, track);
            const album = albumLookup[t.album.id] || looseAlbumLookup[t.album.name];
            if (!album) {
                console.warn("Could not find album %s (%s)", t.album.id, t.album.name, t);
            } else {
                album.tracks.add(t);
            }
        }

        this.libraryTree = libraryTree;

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