<template>
    <section
        id="music-library"
        aria-label="Music Library"
        :class="{
            searching: this.isSearching,
        }"
    >
        <form role="search" @submit.prevent class="search-controls">
            <input
                type="text"
                v-model="searchText"
                placeholder="Search your library"
            />
        </form>
        <psv-tree
            v-if="loaded"
            class="library-tree"
            :items="treeItems"
            :populateChildren="populateChildren"
            @activate-item="$emit('activate-item', $event)"
            @update-selection="updateSelection"
        ></psv-tree>
        <p v-if="!loaded">Loading...</p>
    </section>
</template>

<script lang="ts">
import { Album, Artist, LibraryItem, Track } from './types';
import Library from './library';
import { PsvTree, TreeItem } from '../common/tree';
import { defineComponent } from 'vue';

import { buildTreeNode, buildTreeLeaf } from '../common/tree/tree-item';
import { debounced } from '../common/utils';

type LibraryTree = Array<Artist>;

function artistTreeNode(artist: Artist): TreeItem<LibraryItem> {
    return buildTreeNode(artist.id, artist.name, artist.type, artist);
}

function albumTreeNode(album: Album): TreeItem<LibraryItem> {
    return buildTreeNode(album.id, album.name, album.type, album);
}

function trackTreeNode(track: Track): TreeItem<Track> {
    return buildTreeLeaf(track.id, track.name, track.type, track);
}

function libraryTreeNode(item: LibraryItem): TreeItem<LibraryItem> {
    switch (item.type) {
        case 'artist':
            return artistTreeNode(item);
        case 'album':
            return albumTreeNode(item);
        case 'track':
            return trackTreeNode(item);
    }
}

export default defineComponent({
    components: { PsvTree },
    emits: ['activate-item', 'update-selection'],
    data() {
        return {
            searchText: '',
            debouncedSearch: null as (() => void) | null,
            treeItems: [] as Array<TreeItem<LibraryItem>>,
            loaded: false,
            libraryTree: [] as LibraryTree,
            isSearching: false,
        };
    },
    props: {
        library: {
            type: Library,
            required: true,
        },
    },
    watch: {
        searchText() {
            if (this.debouncedSearch) {
                this.debouncedSearch();
            }
        },
    },
    methods: {
        async populateChildren(
            treeItem: TreeItem<LibraryItem>,
            parents: Array<TreeItem<LibraryItem>>
        ): Promise<Array<TreeItem<LibraryItem>>> {
            const item = treeItem.data;
            if (item.type === 'artist') {
                const albums = await this.library.getArtistAlbums(
                    item.id,
                    true
                );
                return albums.map((album) => albumTreeNode(album));
            } else if (item.type === 'album') {
                const parent = parents[0]?.data;

                let tracks = await this.library.getAlbumTracks(item.id);
                if (parent && parent.type === 'artist') {
                    const artist = parent;
                    let isOwnAlbum = false;

                    for (const albumArtist of item.albumArtists) {
                        if (albumArtist.id === artist.id) {
                            isOwnAlbum = true;
                            break;
                        }
                    }

                    if (!isOwnAlbum) {
                        tracks = tracks.filter((t) => {
                            return [...t.artists]
                                .map((aa) => aa.id)
                                .includes(artist.id);
                        });
                    }
                }

                return tracks.map((t) => trackTreeNode(t));
            }
            return [];
        },
        async doSearch() {
            const searchText = this.searchText.trim();
            let libraryItems = [];
            if (searchText === '') {
                libraryItems = await this.library.getArtists();
                this.isSearching = false;
            } else {
                libraryItems = await this.library.search(searchText);
                this.isSearching = true;
            }
            this.treeItems = libraryItems.map(libraryTreeNode);
            this.$forceUpdate();
        },
        updateSelection(selection: Array<TreeItem<LibraryItem>>) {
            this.$emit(
                'update-selection',
                [...selection].map((x) => x.data)
            );
        },
    },
    async created() {
        const library = Library.getInstance();
        if (!library) {
            return;
        }

        const artists = await library.getArtists();
        this.debouncedSearch = debounced(this.doSearch.bind(this));
        this.libraryTree = artists;
        this.loaded = true;
        this.treeItems = artists.map((a) => artistTreeNode(a));
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

#music-library {
    padding: $dims-padding-dense;
    display: grid;
    grid-template-rows: auto 1fr;
}

#music-library.searching .psv-tree > .psv-tree-node {
    > header .expander::after {
        font-family: 'foundation-icons';
        padding-left: $dims-padding;
        display: inline-block;
    }

    &.album > header .expander::after {
        content: '\f1a4'; // fi-record
    }

    &.artist > header .expander::after {
        content: '\f1fe'; // fi-torso
    }
}

.search-controls {
    width: 100%;
    margin-bottom: $dims-padding;
}

.search-controls input {
    width: 100%;
}

#music-library > .psv-tree {
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    overflow-x: hidden;
    overflow-y: auto;
}

#music-library > .psv-tree > :last-child {
    padding-bottom: $dims-bottom-spacing;
}
</style>