import { Album, Artist, LibraryItem, Track } from '../library';

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

export interface BaseServerDefinition {
    id: string;
    ty: string;
    name: string;
}

export interface MediaServer {
    library(): MediaServerLibrary;
    username(): Promise<string>;
    serverId(): string;
    serverName(): Promise<string>;
    logout(): Promise<void>;
}

export interface MediaServerAuth<Definition, ServerType extends MediaServer> {
    reconnect(server: Definition): Promise<ServerType>;
    login(
        address: string,
        usernae: string,
        password: string
    ): Promise<ServerType>;
}

export abstract class MediaServerLibrary {
    abstract loadState(): LibraryLoadState;
    abstract populate(): Promise<void>;

    abstract getTracks(): Promise<Track[]>;
    abstract getArtists(): Promise<Artist[]>;
    abstract getAlbumArtists(): Promise<Artist[]>;
    abstract getAlbums(): Promise<Album[]>;

    abstract getAlbumsOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Album[]>;
    abstract getTracksOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Track[]>;
    abstract getTracksOfAlbum(albumId: string): Promise<Track[]>;
    abstract getTrackById(trackId: string): Promise<Track | null>;

    abstract search(searchText: string): Promise<LibraryItem[]>;

    abstract getPlaybackUrl(track: Track): string;

    async getTracksByIds(trackIds: string[]): Promise<Track[]> {
        const results = await Promise.all(
            trackIds.map((id) => this.getTrackById(id))
        );
        const foundTracks = [] as Track[];
        for (const track of results) {
            if (track !== null) {
                foundTracks.push(track);
            }
        }
        return foundTracks;
    }
}
