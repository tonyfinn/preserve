import * as Jellyfin from 'jellyfin-apiclient';
import { sorted } from '../common/utils';
import { UNKNOWN_ARTIST_NAME, UNKNOWN_ALBUM_NAME } from '../common/constants';
import { reactive } from 'vue';
import {
    Artist,
    Album,
    Track,
    LibraryItem,
    ItemStub,
    ItemLookup,
    HasArtists,
    Item,
} from './types';
import { sortAlbums, sortArtists, sortTracks } from './utils';

declare global {
    interface Window {
        library: Library;
    }
}

class LibraryLoadState {
    artistTotal: number;
    albumTotal: number;
    trackTotal: number;
    artistLoaded: number;
    albumLoaded: number;
    trackLoaded: number;
    done: boolean;

    constructor() {
        this.artistTotal = this.albumTotal = this.trackTotal = -1;
        this.artistLoaded = this.albumLoaded = this.trackLoaded = 0;
        this.done = false;
    }
}

export default class Library {
    apiClient: Jellyfin.ApiClient | null;
    loadingState: LibraryLoadState;
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

    constructor() {
        this.artists = [];
        this.albums = [];
        this.tracks = [];
        this.apiClient = null;
        this.artistByIdLookup = new Map();
        this.albumByIdLookup = new Map();
        this.trackByIdLookup = new Map();
        this.albumByFeaturedArtistLookup = new Map();
        this.albumByAlbumArtistLookup = new Map();
        this.trackByAlbumLookup = new Map();
        this.loadingState = reactive(new LibraryLoadState());

        window.library = this;
    }

    serverId(): string | null {
        return this.apiClient?.serverId() || null;
    }

    requireApiClient(): Jellyfin.ApiClient {
        if (!this.apiClient) {
            throw new Error('Tried to populate library when disconnected');
        }
        return this.apiClient;
    }

    async populate(apiClient: Jellyfin.ApiClient): Promise<void> {
        this.apiClient = apiClient;
        const artistLoading = this.loadArtists(apiClient);
        const albumLoading = this.loadAlbums(apiClient);
        const trackLoading = this.loadTracks(apiClient);

        return Promise.all([artistLoading, albumLoading, trackLoading]).then(
            ([_artists, _albums, tracks]) => {
                this.buildSyntheticArtists(tracks);
                this.buildSyntheticArtists(this.albums);
                this.buildSyntheticAlbums(tracks);
                this.artists.sort(sortArtists);
                this.loadingState.done = true;
            }
        );
    }

    async loadArtists(apiClient: Jellyfin.ApiClient): Promise<Array<Artist>> {
        let startIndex = 0;
        const userId = apiClient.getCurrentUserId();
        let items = [];
        do {
            const firstResult = await apiClient.getArtists(userId, {
                Limit: 500,
                StartIndex: startIndex,
                SortBy: 'Name',
                SortOrder: 'Ascending',
            });
            this.loadingState.artistTotal = firstResult.TotalRecordCount;
            items = firstResult.Items;
            startIndex = this.loadingState.artistLoaded +=
                firstResult.Items.length;
            for (const item of items) {
                this.loadArtist(item);
            }
        } while (
            items.length > 0 &&
            this.loadingState.artistLoaded < this.loadingState.artistTotal
        );
        return this.artists;
    }

    async loadAlbums(apiClient: Jellyfin.ApiClient): Promise<Array<Album>> {
        let startIndex = 0;
        const userId = apiClient.getCurrentUserId();
        let items = [];
        do {
            const result = await apiClient.getItems<Jellyfin.Album>(userId, {
                Limit: 500,
                recursive: true,
                IncludeItemTypes: 'MusicAlbum',
                StartIndex: startIndex,
                SortBy: 'Name',
                SortOrder: 'Ascending',
            });
            this.loadingState.albumTotal = result.TotalRecordCount;
            items = result.Items;
            startIndex = this.loadingState.albumLoaded += result.Items.length;
            for (const item of items) {
                this.loadAlbum(item);
            }
        } while (
            items.length > 0 &&
            this.loadingState.albumLoaded < this.loadingState.albumTotal
        );
        return this.albums;
    }

    async loadTracks(apiClient: Jellyfin.ApiClient): Promise<Array<Track>> {
        let startIndex = 0;
        const userId = apiClient.getCurrentUserId();
        let items = [];
        do {
            const result = await apiClient.getItems<Jellyfin.Track>(userId, {
                Limit: 500,
                recursive: true,
                IncludeItemTypes: 'Audio',
                StartIndex: startIndex,
                SortBy: 'Name',
                SortOrder: 'Ascending',
            });
            this.loadingState.trackTotal = result.TotalRecordCount;
            items = result.Items;
            startIndex = this.loadingState.trackLoaded += result.Items.length;
            for (const item of items) {
                this.loadTrack(item);
            }
        } while (
            items.length > 0 &&
            this.loadingState.trackLoaded < this.loadingState.trackTotal
        );
        return this.tracks;
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

    async getTracksByIds(trackIds: Array<string>): Promise<Array<Track>> {
        const result = [];

        for (const trackId of trackIds) {
            const track = this.trackByIdLookup.get(trackId);
            if (track) {
                result.push(track);
            }
        }
        return result;
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

    artistFromTrack(stub: ItemStub, serverId: string): Artist {
        return {
            id: stub.id,
            name: stub.name,
            albums: [],
            type: 'artist',
            synthetic: true,
            serverId: serverId,
        };
    }

    buildSyntheticArtists(items: Array<Item & HasArtists>): Array<Artist> {
        const newSyntheticArtists = new Map<string, Artist>();
        for (const item of items) {
            for (const artistStub of [...item.artists, ...item.albumArtists]) {
                const artistId = artistStub.id;
                if (!this.artistByIdLookup.get(artistId)) {
                    const artist = this.artistFromTrack(
                        artistStub,
                        item.serverId
                    );
                    this.artistByIdLookup.set(artistId, artist);
                    this.artists.push(artist);
                    newSyntheticArtists.set(artist.id, artist);
                }
            }
        }
        return Object.values(newSyntheticArtists);
    }

    buildSyntheticAlbums(tracks: Array<Track>): Array<Album> {
        const syntheticAlbums = new Map<string, Album>();
        for (const track of tracks) {
            const albumId = track.album.id;
            if (!this.albumByIdLookup.get(albumId)) {
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
        const albumArtistIds = [];
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
                    this.albumByFeaturedArtistLookup.set(artist.id, [album]);
                }
            }
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
            synthetic: false,
            type: 'artist',
        };
    }

    loadAlbum(jfAlbum: Jellyfin.Album): Album {
        const album = this.mapAlbum(jfAlbum);
        this.createAlbumLookups(album);
        this.albumByIdLookup.set(album.id, album);
        this.albums.push(album);
        return album;
    }

    artistsFromArtistStubs(stubs: Array<Jellyfin.ArtistStub>): Set<ItemStub> {
        const artists = new Set<ItemStub>(
            stubs.map((aa) => ({
                id: this.artistIdFromStub(aa),
                name: aa.Name || UNKNOWN_ARTIST_NAME,
                type: 'artist',
            }))
        );

        if (artists.size === 0) {
            artists.add({
                id: `synth-${UNKNOWN_ARTIST_NAME}`,
                name: UNKNOWN_ARTIST_NAME,
                type: 'artist',
            });
        }

        return artists;
    }

    mapAlbum(album: Jellyfin.Album): Album {
        return {
            id: album.Id,
            name: album.Name,
            serverId: album.ServerId,
            albumArtists: this.artistsFromArtistStubs(album.AlbumArtists),
            artists: this.artistsFromArtistStubs(album.ArtistItems),
            tracks: [],
            albumArtId: album.ImageTags.Primary,
            year: album.ProductionYear,
            type: 'album',
            synthetic: false,
        };
    }

    artistIdFromStub(stub: Jellyfin.ArtistStub): string {
        if (stub.Id) {
            return stub.Id;
        } else if (stub.Name) {
            return `synth-${stub.Name}`;
        } else {
            return `synth-${UNKNOWN_ARTIST_NAME}`;
        }
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
        const apiClient = this.requireApiClient();
        return this.requireApiClient().getUrl(`/Audio/${track.id}/universal`, {
            UserId: apiClient.getCurrentUserId(),
            DeviceId: apiClient.deviceId(),
            api_key: apiClient.accessToken(),
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

    mapTrack(track: Jellyfin.Track): Track {
        return {
            id: track.Id,
            name: track.Name,
            serverId: track.ServerId,
            artists: this.artistsFromArtistStubs(track.ArtistItems),
            albumArtists: this.artistsFromArtistStubs(track.AlbumArtists),
            trackNumber: track.IndexNumber,
            discNumber: track.ParentIndexNumber,
            duration: Math.floor(track.RunTimeTicks / 10_000_000),
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

    async search(searchText: string): Promise<Array<LibraryItem>> {
        const searchRegex = new RegExp(searchText, 'i');
        const artistResults = [];
        const albumResults = [];
        const trackResults = [];
        for (const artist of this.artists) {
            if (searchRegex.test(artist.name)) {
                artistResults.push(artist);
                if (artistResults.length > 10) {
                    break;
                }
            }
        }
        for (const album of this.albums) {
            if (searchRegex.test(album.name)) {
                albumResults.push(album);
                if (albumResults.length > 10) {
                    break;
                }
            }
        }
        for (const track of this.tracks) {
            if (searchRegex.test(track.name)) {
                trackResults.push(track);
                if (trackResults.length > 10) {
                    break;
                }
            }
        }
        return [...trackResults, ...albumResults, ...artistResults];
    }

    async getArtists(): Promise<Array<Artist>> {
        return this.artists;
    }

    async getAlbums(): Promise<Array<Album>> {
        return this.albums;
    }

    async getTracks(): Promise<Array<Track>> {
        return this.tracks;
    }

    static createInstance(): Library {
        const library = new Library();
        Library.instance = library;
        return library;
    }

    static getInstance(): Library | null {
        return Library.instance || null;
    }
}