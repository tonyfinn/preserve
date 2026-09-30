<template>
    <section
        id="music-library"
        data-testid="music-library-tree"
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
        <div class="tree-area">
            <div v-if="loaded">
                <p v-if="refreshPending">
                    <button @click="switchToLoaded">
                        Show Newly Loaded Items
                    </button>
                </p>
                <p v-if="!allLibrariesLocal">
                    <i
                        class="loading-spinner-icon fi-loop"
                        aria-hidden="true"
                    ></i>
                    Loading (use search for others)
                </p>
            </div>
            <psv-tree
                v-if="loaded"
                class="library-tree"
                :items="treeItems"
                :populateChildren="populateChildren"
                @tree-activate-item="$emit('activate-item', $event)"
                @update-selection="updateSelection"
            ></psv-tree>
            <p v-if="!loaded">Loading...</p>
        </div>
        <select
            data-testid="music-library-sort"
            class="sort-mode"
            v-model="libraryGrouping"
        >
            <option
                v-for="groupOption in groupOptions"
                :key="groupOption.value"
                :value="groupOption.value"
            >
                {{ groupOption.label }}
            </option>
        </select>
    </section>
</template>

<script lang="ts">
import { Album, Artist, LibraryItem, Track } from './types';
import { GROUP_OPTIONS } from './options';
import { Settings } from '../common/settings';
import { PsvTree, TreeItem } from '../common/tree';
import { defineComponent } from 'vue';

import { buildTreeNode, buildTreeLeaf } from '../common/tree/tree-item';
import { debounced } from '../common/utils';
import { LibraryGroupOption } from './options';
import { LibraryManager } from './manager';

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
            groupOptions: GROUP_OPTIONS,
            libraryGrouping: this.settings.libraryGrouping,
            loaded: false,
            allLibrariesLocal: false,
            hasUserInteraction: false,
            refreshPending: false,
            isSearching: false,
        };
    },
    props: {
        libraryManager: {
            type: LibraryManager,
            required: true,
        },
        settings: {
            type: Settings,
            required: true,
        },
    },
    watch: {
        searchText() {
            this.hasUserInteraction = true;
            if (this.debouncedSearch) {
                this.debouncedSearch();
            }
        },
        'settings.libraryGrouping'() {
            this.populateLibraryTree();
        },
        libraryGrouping(newValue) {
            this.settings.set('libraryGrouping', newValue);
        },
        'libraryManager.allLoaded'(newValue, oldValue) {
            this.allLibrariesLocal = newValue;
            if (oldValue === false && newValue === true) {
                if (this.hasUserInteraction) {
                    this.refreshPending = true;
                } else {
                    this.populateLibraryTree();
                }
            }
        },
    },
    methods: {
        switchToLoaded() {
            this.refreshPending = false;
            this.populateLibraryTree();
        },
        async populateChildren(
            treeItem: TreeItem<LibraryItem>,
            parents: Array<TreeItem<LibraryItem>>
        ): Promise<Array<TreeItem<LibraryItem>>> {
            this.hasUserInteraction = true;
            const item = treeItem.data;
            if (item.type === 'artist') {
                if (
                    this.settings.libraryGrouping ===
                        LibraryGroupOption.Artist_Album ||
                    this.settings.libraryGrouping ===
                        LibraryGroupOption.AlbumArtist_Album ||
                    this.searchText !== ''
                ) {
                    const includeFeatured =
                        this.settings.libraryGrouping ===
                        LibraryGroupOption.Artist_Album;
                    const albums = await this.libraryManager.getAlbumsOfArtist(
                        item.id,
                        includeFeatured
                    );
                    return albums.map(albumTreeNode);
                } else if (
                    this.settings.libraryGrouping ===
                        LibraryGroupOption.Artist ||
                    this.settings.libraryGrouping ===
                        LibraryGroupOption.AlbumArtist
                ) {
                    const includeFeatured =
                        this.settings.libraryGrouping ===
                        LibraryGroupOption.AlbumArtist;
                    const tracks = await this.libraryManager.getTracksOfArtist(
                        item.id,
                        includeFeatured
                    );
                    return tracks.map(trackTreeNode);
                }
            } else if (item.type === 'album') {
                const parent = parents[0]?.data;

                let tracks = await this.libraryManager.getTracksOfAlbum(
                    item.id
                );
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
                            return t.artists
                                .map((aa) => aa.id)
                                .includes(artist.id);
                        });
                    }
                }

                return tracks.map(trackTreeNode);
            }
            return [];
        },
        async doSearch() {
            const searchText = this.searchText.trim();
            let libraryItems = [];
            if (searchText === '') {
                await this.populateLibraryTree();
                this.isSearching = false;
            } else {
                libraryItems = await this.libraryManager.search(searchText);
                this.treeItems = libraryItems.map(libraryTreeNode);
                this.isSearching = true;
            }
            this.$forceUpdate();
        },
        updateSelection(selection: Array<TreeItem<LibraryItem>>) {
            this.$emit(
                'update-selection',
                [...selection].map((x) => x.data)
            );
        },
        async populateLibraryTree() {
            switch (this.settings.libraryGrouping) {
                case LibraryGroupOption.Artist_Album:
                case LibraryGroupOption.Artist: {
                    const artists = await this.libraryManager.getArtists();
                    this.treeItems = artists.map((a) => artistTreeNode(a));
                    break;
                }
                case LibraryGroupOption.AlbumArtist:
                case LibraryGroupOption.AlbumArtist_Album: {
                    const albumArtists = await this.libraryManager.getAlbumArtists();
                    this.treeItems = albumArtists.map((a) => artistTreeNode(a));
                    break;
                }
                case LibraryGroupOption.Album: {
                    const albums = await this.libraryManager.getAlbums();
                    this.treeItems = albums.map((album) =>
                        albumTreeNode(album)
                    );
                    break;
                }
            }
        },
    },
    async created() {
        this.populateLibraryTree();
        this.debouncedSearch = debounced(this.doSearch.bind(this));
        this.loaded = true;
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

#music-library {
    padding: $dims-padding-dense;
    display: grid;
    grid-template-rows: auto 1fr auto;
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

.sort-mode {
    margin-top: $dims-padding;
}

#music-library > .tree-area {
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    overflow-x: hidden;
    overflow-y: auto;
}

#music-library > .tree-area > :last-child {
    padding-bottom: $dims-bottom-spacing;
}
</style>
