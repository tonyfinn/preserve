import {
    BaseItemDto,
    NameGuidPair,
    BaseItemDtoQueryResult,
} from '@jellyfin/client-axios';
import {
    JF_TICKS_PER_MS,
    UNKNOWN_ALBUM_NAME,
    UNKNOWN_ARTIST_NAME,
} from '../../common/constants';
import {
    Track,
    Artist,
    Album,
    sortArtists,
    sortTracks,
    sortAlbums,
} from '../../library';
import {
    HasArtists,
    Item,
    ItemLookup,
    ItemStub,
    LibraryItem,
} from '../../library/types';
import { reactive } from 'vue';
import {
    LibraryLoadStage,
    LibraryLoadState,
    MediaServerLocalLibrary,
    MediaServerRemoteLibrary,
} from '../interface';
import { getOrGenerateClientId } from 'preserve-ui/src/common/client';
import { AxiosResponse } from 'axios';
import { MediaServerLibraryFacade } from 'preserve-ui/src/library/facade';
import { JellyfinApiClient } from './jf-client';

function artistIdFromStub(stub: NameGuidPair): string {
    if (stub.Id) {
        return stub.Id;
    } else if (stub.Name) {
        return `synth-${stub.Name}`;
    } else {
        return `synth-${UNKNOWN_ARTIST_NAME}`;
    }
}

function normaliseArtistStubs(stubs: Array<NameGuidPair>): Array<ItemStub> {
    const artists: Array<ItemStub> = stubs.map((aa) => ({
        id: artistIdFromStub(aa),
        name: aa.Name || UNKNOWN_ARTIST_NAME,
        type: 'artist',
    }));

    if (artists.length === 0) {
        artists.push({
            id: `synth-${UNKNOWN_ARTIST_NAME}`,
            name: UNKNOWN_ARTIST_NAME,
            type: 'artist',
        });
    }

    return artists;
}

function albumIdFromBaseItem(item: BaseItemDto): string {
    if (item.AlbumId) {
        return item.AlbumId;
    }

    const albumArtists = item.AlbumArtists || [];
    const primaryArtistId = albumArtists[0]?.Id || UNKNOWN_ARTIST_NAME;
    const albumName = item.Album || UNKNOWN_ALBUM_NAME;
    return `synth-${primaryArtistId}-${albumName}`;
}

function normaliseArtist(artist: BaseItemDto): Artist | null {
    if (
        artist.Type !== 'MusicArtist' ||
        !artist.Id ||
        !artist.ServerId ||
        !artist.Name
    ) {
        return null;
    }
    return {
        id: artist.Id,
        name: artist.Name,
        serverId: artist.ServerId,
        albums: [],
        synthetic: false,
        type: 'artist',
    };
}

function normaliseAlbum(album: BaseItemDto): Album | null {
    if (
        album.Type !== 'MusicAlbum' ||
        !album.Id ||
        !album.ServerId ||
        !album.Name
    ) {
        return null;
    }
    return {
        id: album.Id,
        name: album.Name,
        serverId: album.ServerId,
        albumArtists: normaliseArtistStubs(album.AlbumArtists || []),
        artists: normaliseArtistStubs(album.ArtistItems || []),
        tracks: [],
        albumArtId: album.ImageTags?.Primary,
        year: album.ProductionYear || undefined,
        type: 'album',
        synthetic: false,
    };
}

function normaliseTrack(track: BaseItemDto): Track | null {
    if (
        track.Type !== 'Audio' ||
        !track.Id ||
        !track.Name ||
        !track.ServerId ||
        !track.RunTimeTicks
    ) {
        return null;
    }
    return {
        id: track.Id,
        name: track.Name,
        serverId: track.ServerId,
        artists: normaliseArtistStubs(track.ArtistItems || []),
        albumArtists: normaliseArtistStubs(track.AlbumArtists || []),
        trackNumber: track.IndexNumber || undefined,
        discNumber: track.ParentIndexNumber || undefined,
        duration: Math.floor(track.RunTimeTicks / (JF_TICKS_PER_MS * 1000)),
        albumArtId: track.AlbumPrimaryImageTag || undefined,
        year: track.ProductionYear || undefined,
        album: {
            id: albumIdFromBaseItem(track),
            name: track.Album || UNKNOWN_ALBUM_NAME,
            type: 'album',
        },
        type: 'track',
    };
}

function normaliseLibraryItem(item: BaseItemDto): LibraryItem | null {
    switch (item.Type) {
        case 'Audio':
            return normaliseTrack(item);
        case 'MusicAlbum':
            return normaliseAlbum(item);
        case 'MusicArtist':
            return normaliseArtist(item);
        default:
            return null;
    }
}

export class JellyfinLibraryLocal extends MediaServerLocalLibrary {
    private _loadState: LibraryLoadState;

    private artists: Array<Artist>;
    private albums: Array<Album>;
    private tracks: Array<Track>;

    private artistByIdLookup: ItemLookup<Artist>;
    private albumByIdLookup: ItemLookup<Album>;
    private trackByIdLookup: ItemLookup<Track>;

    private albumByFeaturedArtistLookup: Map<string, Array<Album>>;
    private albumByAlbumArtistLookup: Map<string, Array<Album>>;

    private trackByAlbumArtistLookup: Map<string, Array<Track>>;
    private trackByArtistLookup: Map<string, Array<Track>>;
    private trackByAlbumLookup: Map<string, Array<Track>>;

    constructor(
        private readonly apiClient: JellyfinApiClient,
        private readonly userId: string
    ) {
        super();
        this._loadState = reactive(new LibraryLoadState());
        this.artists = [];
        this.albums = [];
        this.tracks = [];

        this.artistByIdLookup = new Map();
        this.albumByIdLookup = new Map();
        this.trackByIdLookup = new Map();

        this.albumByFeaturedArtistLookup = new Map();
        this.albumByAlbumArtistLookup = new Map();

        this.trackByAlbumArtistLookup = new Map();
        this.trackByAlbumLookup = new Map();
        this.trackByArtistLookup = new Map();
    }

    loadState(): LibraryLoadState {
        return this._loadState;
    }

    async getTracks(): Promise<Array<Track>> {
        return this.tracks;
    }
    async getArtists(): Promise<Array<Artist>> {
        return this.artists;
    }

    async getAlbumArtists(): Promise<Array<Artist>> {
        const albumArtists = [];
        for (const albumArtistId of this.albumByAlbumArtistLookup.keys()) {
            const artist = this.artistByIdLookup.get(albumArtistId);
            if (artist) {
                albumArtists.push(artist);
            }
        }
        albumArtists.sort(sortArtists);
        return albumArtists;
    }

    async getAlbums(): Promise<Array<Album>> {
        return this.albums;
    }

    async getAlbumsOfArtist(
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

    async getTracksOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Array<Track>> {
        const ownTracks = this.trackByAlbumArtistLookup.get(artistId) || [];

        ownTracks.sort(sortTracks);

        if (!includeFeatured) {
            return [...ownTracks];
        } else {
            const featuredTracks = this.trackByArtistLookup.get(artistId) || [];
            featuredTracks.sort(sortTracks);
            return [...ownTracks, ...featuredTracks];
        }
    }

    async getTracksOfAlbum(albumId: string): Promise<Array<Track>> {
        const tracks = this.trackByAlbumLookup.get(albumId) || [];
        tracks.sort(sortTracks);
        return tracks;
    }

    async getTrackById(trackId: string): Promise<Track | null> {
        return this.trackByIdLookup.get(trackId) || null;
    }

    async populate(): Promise<void> {
        const artistLoading = this.loadArtists();
        const albumLoading = this.loadAlbums();
        const trackLoading = this.loadTracks();

        return Promise.all([artistLoading, albumLoading, trackLoading]).then(
            ([_artists, _albums, tracks]) => {
                this.buildSyntheticArtists(tracks);
                this.buildSyntheticArtists(this.albums);
                this.buildSyntheticAlbums(tracks);
                this.artists.sort(sortArtists);
                this._loadState.stage = LibraryLoadStage.Loaded;
            }
        );
    }

    async search(searchText: string): Promise<LibraryItem[]> {
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

    getPlaybackUrl(_track: Track, _requestId: string): string {
        throw new Error('Method not implemented.');
    }

    private storeArtist(jfArtist: BaseItemDto) {
        const artist = normaliseArtist(jfArtist);
        if (artist) {
            this.artistByIdLookup.set(artist.id, artist);
            this.artists.push(artist);
        } else {
            console.error('Failed to load artist from', jfArtist);
        }
    }

    private storeAlbum(jfAlbum: BaseItemDto) {
        const album = normaliseAlbum(jfAlbum);
        if (album) {
            this.createAlbumLookups(album);
            this.albumByIdLookup.set(album.id, album);
            this.albums.push(album);
        } else {
            console.error('failed to load album from', jfAlbum);
        }
    }

    private storeTrack(jfTrack: BaseItemDto) {
        const track = normaliseTrack(jfTrack);
        if (!track) {
            console.error('Failed to load track from', jfTrack);
            return;
        }
        this.tracks.push(track);
        this.trackByIdLookup.set(track.id, track);
        const trackLookup = this.trackByAlbumLookup.get(track.album.id);
        if (trackLookup) {
            trackLookup.push(track);
        } else {
            this.trackByAlbumLookup.set(track.album.id, [track]);
        }
        this.createTrackLookups(track);
        return track;
    }

    private async loadArtists(): Promise<Array<Artist>> {
        let startIndex = 0;
        let items = [];
        do {
            const firstResult = await this.apiClient.artists().getArtists({
                limit: 500,
                startIndex: startIndex,
                userId: this.userId,
            });
            if (
                firstResult.status === 200 &&
                firstResult.data.TotalRecordCount &&
                firstResult.data.Items
            ) {
                this._loadState.artistTotal = firstResult.data.TotalRecordCount;
                items = firstResult.data.Items;
                this._loadState.artistLoaded += items.length;
                startIndex = this._loadState.artistLoaded;
                for (const item of items) {
                    this.storeArtist(item);
                }
            } else {
                this._loadState.stage = LibraryLoadStage.Failed;
                break;
            }
        } while (
            items.length > 0 &&
            this._loadState.artistLoaded < this._loadState.artistTotal
        );
        return this.artists;
    }

    private async loadAlbums(): Promise<Array<Album>> {
        let startIndex = 0;
        let items = [];
        do {
            const itemsApi = this.apiClient.items();
            const result = await itemsApi.getItemsByUserId({
                userId: this.userId,
                limit: 500,
                recursive: true,
                includeItemTypes: ['MusicAlbum'],
                startIndex: startIndex,
                sortBy: 'Name',
                sortOrder: 'Ascending',
            });
            if (
                result.status === 200 &&
                result.data.TotalRecordCount &&
                result.data.Items
            ) {
                this._loadState.albumTotal = result.data.TotalRecordCount;
                items = result.data.Items;
                this._loadState.albumLoaded += items.length;
                startIndex = this._loadState.albumLoaded;
                for (const item of items) {
                    this.storeAlbum(item);
                }
            } else {
                this._loadState.stage = LibraryLoadStage.Failed;
                break;
            }
        } while (
            items.length > 0 &&
            this._loadState.albumLoaded < this._loadState.albumTotal
        );
        return this.albums;
    }

    async loadTracks(): Promise<Array<Track>> {
        let startIndex = 0;
        let items = [];
        do {
            const itemsApi = this.apiClient.items();
            const result = await itemsApi.getItemsByUserId({
                userId: this.userId,
                limit: 500,
                recursive: true,
                includeItemTypes: ['Audio'],
                startIndex: startIndex,
                sortBy: 'Name',
                sortOrder: 'Ascending',
            });
            if (
                result.status === 200 &&
                result.data.TotalRecordCount &&
                result.data.Items
            ) {
                this._loadState.trackTotal = result.data.TotalRecordCount;
                items = result.data.Items;
                this._loadState.trackLoaded += items.length;
                startIndex = this._loadState.trackLoaded;
                for (const item of items) {
                    this.storeTrack(item);
                }
            } else {
                this._loadState.stage = LibraryLoadStage.Failed;
                break;
            }
        } while (
            items.length > 0 &&
            this._loadState.trackLoaded < this._loadState.trackTotal
        );
        return this.tracks;
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
            albumArtId: track.albumArtId,
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

    private buildSyntheticAlbums(tracks: Array<Track>): Array<Album> {
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

    private createAlbumLookups(album: Album): void {
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

    private createTrackLookups(track: Track): void {
        for (const albumArtist of track.albumArtists) {
            const lookup = this.trackByAlbumArtistLookup.get(albumArtist.id);
            if (lookup) {
                lookup.push(track);
            } else {
                this.trackByAlbumArtistLookup.set(albumArtist.id, [track]);
            }
        }
        for (const artist of track.artists) {
            const lookup = this.trackByArtistLookup.get(artist.id);
            if (lookup) {
                lookup.push(track);
            } else {
                this.trackByArtistLookup.set(artist.id, [track]);
            }
        }
    }
}

export class JellyfinLibraryRemote extends MediaServerRemoteLibrary {
    constructor(
        private readonly apiClient: JellyfinApiClient,
        private readonly userId: string
    ) {
        super();
    }

    getPlaybackUrl(_track: Track, _requestId: string): string {
        throw new Error('Method not implemented.');
    }

    private convertJfResponse<T>(
        jfItems: AxiosResponse<BaseItemDtoQueryResult>,
        normaliser: (item: BaseItemDto) => T | null
    ): T[] {
        const itemData = jfItems.data.Items || [];

        const items: T[] = [];
        for (const artist of itemData) {
            const parsed = normaliser(artist);
            if (parsed) {
                items.push(parsed);
            }
        }

        return items;
    }

    async getArtists(): Promise<Artist[]> {
        const jfArtists = await this.apiClient.artists().getArtists({
            limit: 100,
            startIndex: 0,
            userId: this.userId,
        });

        return this.convertJfResponse(jfArtists, normaliseArtist);
    }

    async getAlbumArtists(): Promise<Artist[]> {
        const jfArtists = await this.apiClient.artists().getAlbumArtists({
            limit: 100,
            startIndex: 0,
            userId: this.userId,
        });

        return this.convertJfResponse(jfArtists, normaliseArtist);
    }

    async getAlbums(): Promise<Album[]> {
        const jfAlbums = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['MusicAlbum'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
        });
        return this.convertJfResponse(jfAlbums, normaliseAlbum);
    }

    async getTracks(): Promise<Track[]> {
        const jfTracks = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
        });
        return this.convertJfResponse(jfTracks, normaliseTrack);
    }

    async getAlbumsOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Album[]> {
        const artistFilter = includeFeatured
            ? {
                  artistIds: [artistId],
              }
            : { albumArtistIds: [artistId] };
        const jfAlbums = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['MusicAlbum'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            ...artistFilter,
        });
        return this.convertJfResponse(jfAlbums, normaliseAlbum);
    }

    async getTracksOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Track[]> {
        const artistFilter = includeFeatured
            ? {
                  artistIds: [artistId],
              }
            : { albumArtistIds: [artistId] };
        const jfTracks = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            ...artistFilter,
        });
        return this.convertJfResponse(jfTracks, normaliseTrack);
    }

    async getTracksOfAlbum(albumId: string): Promise<Track[]> {
        const jfTracks = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            albumIds: [albumId],
        });
        return this.convertJfResponse(jfTracks, normaliseTrack);
    }

    async getTrackById(trackId: string): Promise<Track | null> {
        const jfTracks = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            ids: [trackId],
        });
        return this.convertJfResponse(jfTracks, normaliseTrack)[0] || null;
    }

    async getTracksById(trackIds: string[]): Promise<Track[]> {
        const jfTracks = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            ids: trackIds,
        });
        return this.convertJfResponse(jfTracks, normaliseTrack);
    }

    async search(searchText: string): Promise<LibraryItem[]> {
        const jfItems = await this.apiClient.items().getItemsByUserId({
            userId: this.userId,
            limit: 100,
            recursive: true,
            includeItemTypes: ['Audio', 'MusicArtist', 'MusicAlbum'],
            startIndex: 0,
            sortBy: 'Name',
            sortOrder: 'Ascending',
            searchTerm: searchText,
        });
        return this.convertJfResponse(jfItems, normaliseLibraryItem);
    }
}
export class JellyfinLibrary extends MediaServerLibraryFacade {
    constructor(
        private readonly apiClient: JellyfinApiClient,
        private readonly userId: string
    ) {
        super(
            new JellyfinLibraryLocal(apiClient, userId),
            new JellyfinLibraryRemote(apiClient, userId)
        );
    }

    getPlaybackUrl(track: Track, requestId: string): string {
        if (!this.apiClient.accessToken) {
            throw new Error('Tried to get playback URL while logged out');
        }
        const basePath = this.apiClient.address;

        const baseUrl = `${basePath}/Audio/${track.id}/universal`;

        const queryParams = new URLSearchParams({
            userId: this.userId,
            deviceId: getOrGenerateClientId(),
            api_key: this.apiClient.accessToken,
            playSessionId: requestId,
            maxStreamingBitrate: '140000000',
            container: 'opus,mp3|mp3,aac,m4a,m4b|aac,flac,webma,webm,wav,ogg',
            transcodingContainer: 'ts',
            transcodingProtocol: 'hls',
            audioCodec: 'aac',
            startTimeTicks: '0',
            enableRedirection: 'true',
            enableRemoteMedia: 'false',
        });

        return `${baseUrl}?${queryParams}`;
    }
}
