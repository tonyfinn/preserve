import { Album, Artist, HasArtists, Item, ItemStub, Track } from './types';

import { DBSchema, openDB, IDBPDatabase, deleteDB } from 'idb';

import { UNKNOWN_ALBUM_NAME } from '../common/constants';

interface TrackEntry {
    data: Track;
    artistIds: Array<string>;
    albumArtistIds: Array<string>;
}

interface AlbumEntry {
    data: Album;
    artistIds: Array<string>;
    albumArtistIds: Array<string>;
}

interface ArtistEntry {
    data: Artist;
    isAlbumArtist: boolean;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
interface LibrarySchema extends DBSchema {
    tracks: {
        value: TrackEntry;
        key: string;
        indexes: {
            'by-genre': string;
            'by-album': string;
            'by-album-artist': string;
            'by-artist': string;
        };
    };
    artists: {
        value: ArtistEntry;
        key: string;
        indexes: {
            'by-genre': string;
        };
    };
    albums: {
        value: AlbumEntry;
        key: string;
        indexes: {
            'by-genre': string;
            'by-album-artist': string;
            'by-artist': string;
        };
    };
}

export class LibraryDatabase {
    constructor(private db: IDBPDatabase) {}

    async addTracks(tracks: Track[]): Promise<void> {
        const tx = this.db.transaction('tracks', 'readwrite');
        const reqs = [] as Promise<unknown>[];
        for (const track of tracks) {
            const artistIds = track.artists.map((a) => a.id);
            const albumArtistIds = track.albumArtists.map((aa) => aa.id);
            reqs.push(
                tx.store.add({
                    data: track,
                    artistIds,
                    albumArtistIds,
                })
            );
        }
        reqs.push(tx.done);
        await Promise.all(reqs);
    }

    async addAlbums(albums: Album[]): Promise<void> {
        const tx = this.db.transaction('albums', 'readwrite');
        const reqs = [] as Promise<unknown>[];
        for (const album of albums) {
            const artistIds = album.artists.map((a) => a.id);
            const albumArtistIds = album.albumArtists.map((aa) => aa.id);
            reqs.push(
                tx.store.add({
                    data: album,
                    artistIds,
                    albumArtistIds,
                })
            );
        }
        reqs.push(tx.done);
        await Promise.all(reqs);
    }

    async addArtists(artists: ArtistEntry[]): Promise<void> {
        const tx = this.db.transaction('artists', 'readwrite');
        const reqs = [] as Promise<unknown>[];
        for (const artist of artists) {
            reqs.push(tx.store.add(artist));
        }
        reqs.push(tx.done);
        await Promise.all(reqs);
    }

    static async open(name: string): Promise<LibraryDatabase> {
        const db = await openDB(name, 1, {
            upgrade(db) {
                const trackStore = db.createObjectStore('tracks', {
                    keyPath: 'data.id',
                });
                trackStore.createIndex('by-genre', 'data.genres', {
                    multiEntry: true,
                });
                trackStore.createIndex('by-album', 'data.album.id');
                trackStore.createIndex('by-album-artist', 'albumArtistsIds', {
                    multiEntry: true,
                });
                trackStore.createIndex('by-artist', 'artistIds', {
                    multiEntry: true,
                });

                const albumStore = db.createObjectStore('albums', {
                    keyPath: 'data.id',
                });
                albumStore.createIndex('by-genre', 'data.genres', {
                    multiEntry: true,
                });
                albumStore.createIndex('by-album-artist', 'albumArtistsIds', {
                    multiEntry: true,
                });
                albumStore.createIndex('by-artist', 'artistIds', {
                    multiEntry: true,
                });

                const artistStore = db.createObjectStore('artists', {
                    keyPath: 'data.id',
                });
                artistStore.createIndex('by-genre', 'data.genres', {
                    multiEntry: true,
                });
            },
            blocked() {
                throw new Error(
                    'Could not open database, older version already open - please close other Preserve tabs'
                );
            },
            blocking() {
                console.log('This is blocking a newer version of the DDB open');
            },
        });

        return new LibraryDatabase(db);
    }
}

export class LibraryBuilder {
    private artists: Array<Artist>;
    private albums: Array<Album>;
    private tracks: Array<Track>;

    private artistsCreated: Set<string>;
    private albumsCreated: Set<string>;
    private artistsFoundAsAlbumArtists: Set<string>;

    constructor(private name: string) {
        this.artists = [];
        this.albums = [];
        this.tracks = [];
        this.artistsCreated = new Set();
        this.albumsCreated = new Set();
        this.artistsFoundAsAlbumArtists = new Set();
    }

    addArtist(artist: Artist): void {
        this.artists.push(artist);
        this.artistsCreated.add(artist.id);
    }

    addAlbum(album: Album): void {
        this.albums.push(album);
        this.albumsCreated.add(album.id);
        for (const albumArtist of album.albumArtists) {
            this.artistsFoundAsAlbumArtists.add(albumArtist.id);
        }
    }

    addTrack(track: Track): void {
        this.tracks.push(track);
    }

    private artistFromTrack(stub: ItemStub, serverId: string): Artist {
        return {
            id: stub.id,
            name: stub.name,
            albums: [],
            type: 'artist',
            synthetic: true,
            serverId: serverId,
        };
    }

    private albumFromTrack(albumId: string, track: Track): Album {
        return {
            id: albumId,
            name: track.album.name || UNKNOWN_ALBUM_NAME,
            serverId: track.serverId,
            albumArtists: [...track.albumArtists],
            artists: [...track.artists],
            year: track.year,
            tracks: [],
            type: 'album',
            synthetic: true,
        };
    }

    private buildSyntheticArtists(
        items: Array<Item & HasArtists>
    ): Array<Artist> {
        const newSyntheticArtists = new Map<string, Artist>();
        for (const item of items) {
            for (const artistStub of [...item.artists, ...item.albumArtists]) {
                const artistId = artistStub.id;
                if (!this.artistsCreated.has(artistId)) {
                    const artist = this.artistFromTrack(
                        artistStub,
                        item.serverId
                    );
                    this.artistsCreated.add(artistId);
                    this.artists.push(artist);
                    newSyntheticArtists.set(artist.id, artist);
                }
            }
            for (const albumArtist of item.albumArtists) {
                this.artistsFoundAsAlbumArtists.add(albumArtist.id);
            }
        }
        return Object.values(newSyntheticArtists);
    }

    private buildSyntheticAlbums(tracks: Array<Track>): Array<Album> {
        const syntheticAlbums = new Map<string, Album>();
        for (const track of tracks) {
            const albumId = track.album.id;
            if (!this.albumsCreated.has(albumId)) {
                const albumId = track.album.id;
                if (!syntheticAlbums.get(albumId)) {
                    const album = this.albumFromTrack(albumId, track);
                    this.albumsCreated.add(albumId);
                    syntheticAlbums.set(album.id, album);
                }
            }
        }
        for (const album of syntheticAlbums.values()) {
            this.albums.push(album);
        }
        return Object.values(syntheticAlbums);
    }

    async build(): Promise<LibraryDatabase> {
        this.buildSyntheticArtists(this.tracks);
        this.buildSyntheticArtists(this.albums);
        this.buildSyntheticAlbums(this.tracks);

        const artistEntries = this.artists.map((artist) => {
            const isAlbumArtist = this.artistsFoundAsAlbumArtists.has(
                artist.id
            );
            return {
                data: artist,
                isAlbumArtist,
            };
        });

        await deleteDB(this.name);

        const db = await LibraryDatabase.open(this.name);
        await db.addArtists(artistEntries);
        await db.addAlbums(this.albums);
        await db.addTracks(this.tracks);
        return db;
    }
}
