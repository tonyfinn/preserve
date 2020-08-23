<template>
    <section id="music-library">
        <div class="search-controls">
            <input
                type="text"
                v-model="searchText"
                placeholder="Search your library"
            />
        </div>
        <psv-tree
            v-if="loaded"
            class="library-tree"
            :items="treeItems"
            @activate-item="$emit('activate-item', $event)"
        ></psv-tree>
        <p v-if="!loaded">Loading...</p>
    </section>
</template>

<script lang="ts">
import { Album, Artist, Library, LibraryItem } from '.';
import { debounced } from '../common/utils';
import { PsvTree, TreeItem } from '../tree';
import { defineComponent } from 'vue';

import LibraryTreeBuilder from 'worker-loader!./tree-builder.worker';

type LibraryTree = Array<Artist>;

function treeViewFromLibrary(
    artists: Array<Artist>,
    searchRegex: RegExp | null
): Promise<Array<TreeItem<LibraryItem>>> {
    return new Promise((resolve) => {
        const libraryTreeWorker = new LibraryTreeBuilder();
        console.log(artists);
        libraryTreeWorker.postMessage({ artists, searchRegex });
        libraryTreeWorker.addEventListener('message', (evt: MessageEvent) => {
            resolve(evt.data);
            libraryTreeWorker.terminate();
        });
    });
}

export default defineComponent({
    components: { PsvTree },
    events: ['activate-item'],
    data() {
        return {
            searchText: '',
            treeItems: [] as Array<TreeItem<LibraryItem>>,
            loaded: false,
            libraryTree: [] as LibraryTree,
        };
    },
    watch: {
        searchText(newText: string): void {
            this.updateTreeView(this.libraryTree, newText.trim());
        },
    },
    props: {
        library: {
            type: Library,
            required: true,
        },
    },
    methods: {
        updateTreeView: debounced(function (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this: any,
            libraryTree: LibraryTree,
            searchText: string
        ) {
            const trimmedText = searchText.trim();
            const emptySearch = trimmedText === '';
            treeViewFromLibrary(
                libraryTree,
                emptySearch ? null : new RegExp(trimmedText, 'i')
            ).then((items) => {
                this.treeItems = items;
            });
        }),
    },
    async created() {
        const library = Library.getInstance();
        if (!library) {
            return;
        }
        const [artists, albums, tracks] = await Promise.all([
            library.getArtists(),
            library.getAlbums(),
            library.getTracks(),
        ]);

        const artistLookup = new Map<string, Artist>();
        const looseArtistLookup = new Map<string, Artist>();

        const albumLookup = new Map<string, Album>();
        const looseAlbumLookup = new Map<string, Album>();

        const libraryTree = [];

        for (const artist of artists) {
            const artistNode = Object.assign({}, artist, {
                albums: [],
                filteredAlbums: [],
                expanded: false,
                selected: false,
                visible: true,
            });
            if (artist.id) {
                artistLookup.set(artist.id, artistNode);
            } else {
                looseArtistLookup.set(artist.name, artistNode);
            }
            libraryTree.push(artistNode);
        }

        for (const album of albums) {
            const albumNode = Object.assign({}, album, {
                tracks: [],
                expanded: false,
                selected: false,
                visible: true,
            });

            if (album.id) {
                albumLookup.set(album.id, albumNode);
            } else {
                looseAlbumLookup.set(album.name, albumNode);
            }

            for (const albumArtist of album.albumArtists) {
                const aa =
                    (albumArtist.id && artistLookup.get(albumArtist.id)) ||
                    (albumArtist.name &&
                        looseArtistLookup.get(albumArtist.name));
                if (!aa) {
                    console.warn(
                        'Could not find album artist %s (%s)',
                        albumArtist.id,
                        albumArtist.name
                    );
                } else {
                    aa.albums.push(albumNode);
                }
            }
        }

        for (const track of tracks) {
            const t = Object.assign(
                {},
                {
                    visible: true,
                    selected: false,
                },
                track
            );
            const album =
                (t.album.id && albumLookup.get(t.album.id)) ||
                (t.album.name && looseAlbumLookup.get(t.album.name));
            if (!album) {
                console.warn(
                    'Could not find album %s (%s)',
                    t.album.id,
                    t.album.name,
                    t
                );
            } else {
                album.tracks.push(t);
            }
        }

        console.time('renderLibraryTree');

        treeViewFromLibrary(libraryTree, null).then((items) => {
            console.timeLog('renderLibraryTree');
            this.treeItems = items;
            this.loaded = true;
            console.timeEnd('renderLibraryTree');
        });

        this.libraryTree = libraryTree;
    },
});
</script>

<style lang="scss">
@import '../styles/colors.scss';
@import '../styles/dims.scss';

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
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    overflow-x: hidden;
    overflow-y: auto;
}
</style>
