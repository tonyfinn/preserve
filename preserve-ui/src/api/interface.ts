import { Album, Artist, Track } from '../library';

export enum LibraryLoadStage {
    New,
    Loading,
    Loaded,
    Failed,
    Remote,
}

export class LibraryLoadState {
    artistTotal: number;
    albumTotal: number;
    trackTotal: number;
    artistLoaded: number;
    albumLoaded: number;
    trackLoaded: number;
    stage = LibraryLoadStage.New;

    constructor() {
        this.artistTotal = this.albumTotal = this.trackTotal = -1;
        this.artistLoaded = this.albumLoaded = this.trackLoaded = 0;
    }
}

export interface MediaServer {
    library(): MediaServerLibrary;
}

export interface MediaServerAuth<Definition, ServerType extends MediaServer> {
    reconnect(server: Definition): Promise<ServerType>;
    login(
        address: string,
        usernae: string,
        password: string
    ): Promise<ServerType>;
}

export interface MediaServerLibrary {
    loadState(): LibraryLoadState;
    populate(): Promise<void>;

    getTracks(): Promise<Array<Track>>;
    getArtists(): Promise<Array<Artist>>;
    getAlbumArtists(): Promise<Array<Artist>>;
    getAlbums(): Promise<Array<Album>>;

    getAlbumsOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Array<Album>>;
    getTracksOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Array<Track>>;
    getTracksOfAlbum(albumId: string): Promise<Array<Track>>;
    getTrackById(trackId: string): Promise<Track | null>;
}
