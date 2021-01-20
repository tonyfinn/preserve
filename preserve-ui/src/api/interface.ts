import { Album, Artist, LibraryItem, Track } from '../library';
import { RepeatMode, ShuffleMode } from '../player';

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

    constructor(public stage: LibraryLoadStage = LibraryLoadStage.New) {
        this.artistTotal = this.albumTotal = this.trackTotal = -1;
        this.artistLoaded = this.albumLoaded = this.trackLoaded = 0;
    }
}

export interface BaseServerDefinition {
    id: string;
    ty: string;
    name: string;
}

export enum MediaServerTestResult {
    NoServer,
    InvalidServer,
    Success,
}

export interface MediaServer {
    library(): MediaServerLibrary;
    reporter(): MediaServerReporter;
    username(): Promise<string>;
    serverId(): string;
    serverName(): Promise<string>;
    logout(): Promise<void>;
    definition(): BaseServerDefinition;
}

export interface MediaServerAuth<
    Definition extends BaseServerDefinition,
    ServerType extends MediaServer
> {
    reconnect(server: Definition): Promise<ServerType>;
    login(
        address: string,
        username: string,
        password: string
    ): Promise<ServerType>;
}

export abstract class MediaServerLibrary {
    abstract loadState(): LibraryLoadState;

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

    abstract getPlaybackUrl(track: Track, requestId: string): string;

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

export abstract class MediaServerLocalLibrary extends MediaServerLibrary {
    abstract populate(): Promise<void>;
}

export abstract class MediaServerRemoteLibrary extends MediaServerLibrary {
    loadState(): LibraryLoadState {
        return new LibraryLoadState(LibraryLoadStage.Remote);
    }
}

export interface PlaybackState {
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    progressMs: number;
    paused: boolean;
    muted: boolean;
    /// volume in range 0-1
    volume: number;
    startTime: Date;
    trackId: string | null;
    trackServerId: string | null;
}

export interface MediaServerReporter {
    trackStarted(playback: PlaybackState): void;
    trackProgress(playback: PlaybackState): void;
    trackFinished(playback: PlaybackState): void;
    shuffleModeChanged(playback: PlaybackState): void;
    repeatModeChanged(playback: PlaybackState): void;
    paused(playback: PlaybackState): void;
    resumed(playback: PlaybackState): void;
    volumeChanged(playback: PlaybackState): void;
    mutedToggled(playback: PlaybackState): void;
}
