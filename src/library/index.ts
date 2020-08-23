const UNKNOWN_ARTIST_NAME = 'Unknown Artist';
const UNKNOWN_ALBUM_NAME = 'Unknown Album';

import * as Jellyfin from 'jellyfin-apiclient';

type ItemType = 'artist' | 'album' | 'track';

interface Item {
    id: string;
    serverId: string;
    type: ItemType;
}

interface ItemStub {
    id?: string;
    name?: string;
    type: ItemType;
}

export interface Artist extends Item {
    name: string;
    albums: Array<Album>;
    type: 'artist';
}

export interface Album extends Item {
    name: string;
    synthetic: boolean;
    year: number;
    artists: Set<ItemStub>;
    albumArtists: Set<ItemStub>;
    tracks: Array<Track>;
    albumArtId?: string;
    type: 'album';
}

export interface Track extends Item {
    name: string;
    artists: Set<ItemStub>;
    albumArtists: Set<ItemStub>;
    album: ItemStub;
    year: number;
    albumArtId?: string;
    trackNumber: number;
    duration: number;
    discNumber: number;
    type: 'track';
}

export type LibraryItem = Artist | Album | Track;

type ItemLookup<T extends Item> = Map<string, T>;

declare global {
    interface Window {
        library: Library;
    }
}


export function sortTracks(a: Track, b: Track): number {
    const aDisc = a.discNumber || -1;
    const bDisc = b.discNumber || -1;
    const aTrack = a.trackNumber || -1;
    const bTrack = b.trackNumber || -1;

    if (aDisc - bDisc != 0) {
        return aDisc - bDisc;
    }

    if (aTrack - bTrack != 0) {
        return aTrack - bTrack;
    }

    return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
}

export function sortAlbums(a: Album, b: Album): number {
    const aYear = a.year;
    const bYear = b.year;

    if (aYear - bYear != 0) {
        return aYear - bYear;
    } else {
        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
    }
}

export function artistNames(t: Track): string {
    if (t.artists && t.artists.size > 0) {
        return [...t.artists].map(a => a.name).join('; ');
    }
    return 'Unknown Artist';
}

export class Library {
    connectionManager: Jellyfin.ConnectionManager;
    apiClient: Jellyfin.ApiClient;
    serverId: string;
    loaded: boolean;
    loadingPromise: Promise<void>;
    albums: Array<Album>;
    tracks: Array<Track>;
    artists: Array<Artist>;
    artistLookup: ItemLookup<Artist>;
    albumLookup: ItemLookup<Album>;
    trackLookup: ItemLookup<Track>;
    static instance: Library;

    constructor(connectionManager: Jellyfin.ConnectionManager) {
        this.connectionManager = connectionManager;
        this.serverId = this.connectionManager.getLastUsedServer().Id;
        this.apiClient = this.connectionManager.getOrCreateApiClient(
            this.serverId
        );
        const userId = this.apiClient.getCurrentUserId();
        this.loaded = false;
        this.artists = [];
        this.albums = [];
        this.tracks = [];
        this.artistLookup = new Map();
        this.albumLookup = new Map();
        this.trackLookup = new Map();
        const artistLoading = this.apiClient
            .getArtists(userId)
            .then((artistsResult) => artistsResult.Items.map(this.mapArtist));
        const albumLoading = this.apiClient
            .getItems<Jellyfin.Album>(userId, {
                recursive: true,
                IncludeItemTypes: 'MusicAlbum',
            })
            .then((albumResult) => albumResult.Items.map(this.mapAlbum));
        const trackLoading = this.apiClient
            .getItems<Jellyfin.Track>(userId, {
                recursive: true,
                IncludeItemTypes: 'Audio',
            })
            .then((trackResult) => trackResult.Items.map(this.mapTrack));

        this.loadingPromise = Promise.all([
            artistLoading,
            albumLoading,
            trackLoading,
        ]).then(([artists, albums, tracks]) => {
            this.artists = artists;
            this.albums = albums;
            this.tracks = tracks;

            this.buildSyntheticAlbums(tracks).forEach((album) =>
                this.albums.push(album)
            );
            this.artistLookup = this.buildLookup(this.artists);
            this.albumLookup = this.buildLookup(this.albums);
            this.trackLookup = this.buildLookup(this.tracks);

            this.loaded = true;
        });

        window.library = this;
        Library.instance = this;
    }

    buildLookup<T extends Item>(items: Array<T>): ItemLookup<T> {
        const lookup = new Map<string, T>();
        for (const item of items) {
            lookup.set(item.id, item);
        }
        return lookup;
    }

    buildSyntheticAlbums(tracks: Array<Track>): Array<Album> {
        const syntheticAlbums = new Map<string, Album>();
        for (const track of tracks) {
            if (!track.album.id) {
                const albumId = this.albumIdFromTrack(track);
                if (!syntheticAlbums.get(albumId)) {
                    const album = this.albumFromTrack(albumId, track);
                    syntheticAlbums.set(album.id, album);
                }
            }
        }
        return Object.values(syntheticAlbums);
    }

    mapArtist(artist: Jellyfin.Artist): Artist {
        return {
            id: artist.Id,
            name: artist.Name,
            serverId: artist.ServerId,
            albums: [],
            type: 'artist',
        };
    }

    mapAlbum(album: Jellyfin.Album): Album {
        return {
            id: album.Id,
            name: album.Name,
            serverId: album.ServerId,
            albumArtists: new Set(
                album.AlbumArtists.map((aa) => ({
                    id: aa.Id,
                    name: aa.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            artists: new Set(
                album.ArtistItems.map((aa) => ({
                    id: aa.Id,
                    name: aa.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            tracks: [],
            albumArtId: album.ImageTags.Primary,
            year: album.ProductionYear,
            type: 'album',
            synthetic: false,
        };
    }

    albumIdFromTrack(track: Track): string {
        const primaryArtistId =
            track.albumArtists.entries().next().value || UNKNOWN_ARTIST_NAME;
        const albumName = track.album.name || UNKNOWN_ALBUM_NAME;
        return `synth-${primaryArtistId}-${albumName}`;
    }

    albumFromTrack(albumId: string, track: Track): Album {
        return {
            id: albumId,
            name: track.album.name || UNKNOWN_ALBUM_NAME,
            serverId: track.serverId,
            albumArtists: new Set(track.albumArtists),
            artists: new Set(track.artists),
            albumArtId: track.albumArtId,
            year: track.year,
            tracks: [],
            type: 'album',
            synthetic: true,
        };
    }

    getPlaybackUrl(track: Track): string {
        return this.apiClient.getUrl(`/Audio/${track.id}/universal`, {
            UserId: this.apiClient.getCurrentUserId(),
            DeviceId: this.apiClient.deviceId(),
            api_key: this.apiClient.accessToken(),
            PlaySessionId: new Date().getTime().toString(),
            MaxStreamingBitrate: "140000000",
            Container: "opus,mp3|mp3,aac,m4a,m4b|aac,flac,webma,webm,wav,ogg",
            TranscodingContainer: "ts",
            TranscodingProtocol: "hls",
            AudioCodec: "aac",
            StartTimeTicks: "0",
            EnableRedirection: "true",
            EnableRemoteMedia: "false",
        });
    }

    mapTrack(track: Jellyfin.Track): Track {
        return {
            id: track.Id,
            name: track.Name,
            serverId: track.ServerId,
            artists: new Set(
                track.ArtistItems.map((artist) => ({
                    id: artist.Id,
                    name: artist.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            trackNumber: track.IndexNumber,
            discNumber: track.ParentIndexNumber,
            duration: Math.floor(track.RunTimeTicks / 10_000_000),
            albumArtists: new Set(
                track.AlbumArtists.map((aa) => ({
                    id: aa.Id,
                    name: aa.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            albumArtId: track.AlbumPrimaryImageTag,
            year: track.ProductionYear,
            album: {
                id: track.AlbumId,
                name: track.Album || UNKNOWN_ALBUM_NAME,
                type: 'album',
            },
            type: 'track',
        };
    }

    async getArtists(): Promise<Array<Artist>> {
        await this.loadingPromise;
        return this.artists;
    }

    async getAlbums(): Promise<Array<Album>> {
        await this.loadingPromise;
        return this.albums;
    }

    async getTracks(): Promise<Array<Track>> {
        await this.loadingPromise;
        return this.tracks;
    }

    static createInstance(connectionManager: Jellyfin.ConnectionManager): Library {
        const library = new Library(connectionManager);
        Library.instance = library;
        return library;
    }

    static getInstance(): Library | null {
        return Library.instance || null;
    }
}