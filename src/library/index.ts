const UNKNOWN_ARTIST_NAME = 'Unknown Artist';
const UNKNOWN_ALBUM_NAME = 'Unknown Album';

import * as Jellyfin from 'jellyfin-apiclient';
import { sorted } from '../common/utils';

type ItemType = 'artist' | 'album' | 'track';

interface Item {
    id: string;
    serverId: string;
    type: ItemType;
}

export interface ItemStub {
    id: string;
    name: string;
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
        return [...t.artists].map((a) => a.name).join('; ');
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
    artistByIdLookup: ItemLookup<Artist>;
    albumByIdLookup: ItemLookup<Album>;
    trackByIdLookup: ItemLookup<Track>;
    albumByFeaturedArtistLookup: Map<string, Array<Album>>;
    albumByAlbumArtistLookup: Map<string, Array<Album>>;
    trackByAlbumLookup: Map<string, Array<Track>>;
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
        this.artistByIdLookup = new Map();
        this.albumByIdLookup = new Map();
        this.trackByIdLookup = new Map();
        this.albumByFeaturedArtistLookup = new Map();
        this.albumByAlbumArtistLookup = new Map();
        this.trackByAlbumLookup = new Map();
        const artistLoading = this.apiClient
            .getArtists(userId)
            .then((artistsResult) =>
                artistsResult.Items.map(this.loadArtist.bind(this))
            );
        const albumLoading = this.apiClient
            .getItems<Jellyfin.Album>(userId, {
                recursive: true,
                IncludeItemTypes: 'MusicAlbum',
            })
            .then((albumResult) =>
                albumResult.Items.map(this.loadAlbum.bind(this))
            );
        const trackLoading = this.apiClient
            .getItems<Jellyfin.Track>(userId, {
                recursive: true,
                IncludeItemTypes: 'Audio',
            })
            .then((trackResult) =>
                trackResult.Items.map(this.loadTrack.bind(this))
            );

        this.loadingPromise = Promise.all([
            artistLoading,
            albumLoading,
            trackLoading,
        ]).then(([_artists, _albums, tracks]) => {
            this.buildSyntheticAlbums(tracks);
            this.loaded = true;
        });

        window.library = this;
        Library.instance = this;
    }

    // actually totally synchronous but marked as async to allow for future
    // dynamic library loading
    async getArtistAlbums(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Array<Album>> {
        const ownAlbums = this.albumByAlbumArtistLookup.get(artistId) || [];

        ownAlbums.sort(sortAlbums);

        if (!includeFeatured) {
            return [...ownAlbums];
        } else {
            const featuredAlbums =
                this.albumByFeaturedArtistLookup.get(artistId) || [];
            featuredAlbums.sort(sortAlbums);
            return [...ownAlbums, ...featuredAlbums];
        }
    }

    // actually totally synchronous but marked as async to allow for future
    // dynamic library loading
    async getAlbumTracks(albumId: string): Promise<Array<Track>> {
        const tracks = this.trackByAlbumLookup.get(albumId) || [];
        tracks.sort(sortTracks);
        return tracks;
    }

    async getChildTracks(item: ItemStub): Promise<Array<Track>> {
        const childTracks = [];
        if (item.type === 'track') {
            const track = this.trackByIdLookup.get(item.id);
            if (track) {
                childTracks.push(track);
            }
        } else if (item.type === 'album') {
            const albumTracks = await this.getAlbumTracks(item.id);
            for (const track of sorted(albumTracks, sortTracks)) {
                childTracks.push(track);
            }
        } else if (item.type === 'artist') {
            const albums = await this.getArtistAlbums(item.id, false);

            const tracksByAlbum = await Promise.all(
                sorted(albums, sortAlbums).map((album) =>
                    this.getAlbumTracks(album.id)
                )
            );
            for (const albumTracks of tracksByAlbum) {
                for (const track of albumTracks) {
                    childTracks.push(track);
                }
            }
        }
        return childTracks;
    }

    buildSyntheticAlbums(tracks: Array<Track>): Array<Album> {
        const syntheticAlbums = new Map<string, Album>();
        for (const track of tracks) {
            if (track.album.id.startsWith('synth')) {
                const albumId = track.album.id;
                if (!syntheticAlbums.get(albumId)) {
                    const album = this.albumFromTrack(albumId, track);
                    this.albumByIdLookup.set(albumId, album);
                    syntheticAlbums.set(album.id, album);
                }
            }
        }
        for (const album of syntheticAlbums.values()) {
            this.albums.push(album);
            this.createAlbumLookups(album);
        }
        return Object.values(syntheticAlbums);
    }

    createAlbumLookups(album: Album): void {
        for (const artist of album.artists) {
            const lookup =
                this.albumByFeaturedArtistLookup.get(
                    artist.id || UNKNOWN_ARTIST_NAME
                ) || null;
            lookup?.push(album);
        }
        for (const artist of album.albumArtists) {
            const lookup =
                this.albumByAlbumArtistLookup.get(
                    artist.id || UNKNOWN_ARTIST_NAME
                ) || null;
            lookup?.push(album);
        }
    }

    loadArtist(jfArtist: Jellyfin.Artist): Artist {
        const artist = this.mapArtist(jfArtist);
        this.artistByIdLookup.set(artist.id, artist);
        this.artists.push(artist);
        return artist;
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

    loadAlbum(jfAlbum: Jellyfin.Album): Album {
        const albumArtistIds = [];
        const album = this.mapAlbum(jfAlbum);
        for (const albumArtist of album.albumArtists) {
            albumArtistIds.push(albumArtist.id);
            const lookup = this.albumByAlbumArtistLookup.get(albumArtist.id);
            if (lookup) {
                lookup.push(album);
            } else {
                this.albumByAlbumArtistLookup.set(albumArtist.id, [album]);
            }
        }
        for (const artist of album.artists) {
            if (!albumArtistIds.includes(artist.id)) {
                const lookup = this.albumByFeaturedArtistLookup.get(artist.id);
                if (lookup) {
                    lookup.push(album);
                } else {
                    this.albumByAlbumArtistLookup.set(artist.id, [album]);
                }
            }
        }
        this.albums.push(album);
        return album;
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

    albumIdFromTrack(track: Jellyfin.Track): string {
        if (track.AlbumId) {
            return track.AlbumId;
        }
        const primaryArtistId =
            track.AlbumArtists[0]?.Id || UNKNOWN_ARTIST_NAME;
        const albumName = track.Album || UNKNOWN_ALBUM_NAME;
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
            MaxStreamingBitrate: '140000000',
            Container: 'opus,mp3|mp3,aac,m4a,m4b|aac,flac,webma,webm,wav,ogg',
            TranscodingContainer: 'ts',
            TranscodingProtocol: 'hls',
            AudioCodec: 'aac',
            StartTimeTicks: '0',
            EnableRedirection: 'true',
            EnableRemoteMedia: 'false',
        });
    }

    loadTrack(jfTrack: Jellyfin.Track): Track {
        const track = this.mapTrack(jfTrack);
        this.tracks.push(track);
        this.trackByIdLookup.set(track.id, track);
        const trackLookup = this.trackByAlbumLookup.get(track.album.id);
        if (trackLookup) {
            trackLookup.push(track);
        } else {
            this.trackByAlbumLookup.set(track.album.id, [track]);
        }
        return track;
    }

    generateArtistId(artistStub: Jellyfin.ArtistStub): string {
        if (artistStub.Id) {
            return artistStub.Id;
        } else if (artistStub.Name) {
            return `synth-${artistStub.Name}`;
        } else {
            return `synth-${UNKNOWN_ARTIST_NAME}`;
        }
    }

    mapTrack(track: Jellyfin.Track): Track {
        return {
            id: track.Id,
            name: track.Name,
            serverId: track.ServerId,
            artists: new Set(
                track.ArtistItems.map((artist) => ({
                    id: this.generateArtistId(artist),
                    name: artist.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            trackNumber: track.IndexNumber,
            discNumber: track.ParentIndexNumber,
            duration: Math.floor(track.RunTimeTicks / 10_000_000),
            albumArtists: new Set(
                track.AlbumArtists.map((aa) => ({
                    id: this.generateArtistId(aa),
                    name: aa.Name || UNKNOWN_ARTIST_NAME,
                    type: 'artist',
                }))
            ),
            albumArtId: track.AlbumPrimaryImageTag,
            year: track.ProductionYear,
            album: {
                id: this.albumIdFromTrack(track),
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

    static createInstance(
        connectionManager: Jellyfin.ConnectionManager
    ): Library {
        const library = new Library(connectionManager);
        Library.instance = library;
        return library;
    }

    static getInstance(): Library | null {
        return Library.instance || null;
    }
}
