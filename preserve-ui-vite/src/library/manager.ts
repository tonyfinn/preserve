import { getChildTracks, MediaServerLibrary } from '../api';
import { ServerManager } from '../common/servers';
import { Album, Artist, ItemStub, LibraryItem, Track } from './types';

import silenceOgg from '../../static/silence.ogg';
import { isMock } from '../common/utils';
import {
    LibraryLoadStage,
    LibraryLoadState,
    MediaServerReporter,
    PlaybackState,
} from '../api/interface';

function sumLibraryField<K extends keyof LibraryLoadState>(
    libs: MediaServerLibrary[],
    fieldName: K
): number {
    let n = 0;
    for (const lib of libs) {
        n += lib.loadState()[fieldName];
    }
    return n;
}

interface LoadingItem {
    name: string;
    total: number;
    loadedCount: number;
}

export class LibraryManager {
    constructor(private readonly serverManager: ServerManager) {}

    private activeLibrary(): MediaServerLibrary {
        return this.serverManager.activeServers()[0].library();
    }

    private libraries(): MediaServerLibrary[] {
        return this.serverManager
            .activeServers()
            .map((server) => server.library());
    }

    allReady(): boolean {
        for (const library of this.libraries()) {
            if (
                library.loadState().stage !== LibraryLoadStage.Loaded &&
                library.loadState().stage !== LibraryLoadStage.Remote
            ) {
                return false;
            }
        }
        return true;
    }

    get allLoaded(): boolean {
        for (const library of this.libraries()) {
            if (library.loadState().stage !== LibraryLoadStage.Loaded) {
                return false;
            }
        }
        return true;
    }
    loadedCount(): number {
        const libraries = this.libraries();
        return (
            sumLibraryField(libraries, 'artistLoaded') +
            sumLibraryField(libraries, 'albumLoaded') +
            sumLibraryField(libraries, 'trackLoaded')
        );
    }
    loadingTotal(): number {
        const libraries = this.libraries();
        return Math.max(
            0,
            sumLibraryField(libraries, 'artistTotal') +
                sumLibraryField(libraries, 'albumTotal') +
                sumLibraryField(libraries, 'trackTotal')
        );
    }
    loadingItems(): Array<LoadingItem> {
        const libraries = this.libraries();
        return [
            {
                name: 'Artists',
                total: sumLibraryField(libraries, 'artistTotal'),
                loadedCount: sumLibraryField(libraries, 'artistLoaded'),
            },
            {
                name: 'Albums',
                total: sumLibraryField(libraries, 'albumTotal'),
                loadedCount: sumLibraryField(libraries, 'albumLoaded'),
            },
            {
                name: 'Tracks',
                total: sumLibraryField(libraries, 'trackTotal'),
                loadedCount: sumLibraryField(libraries, 'trackLoaded'),
            },
        ];
    }
    getTracks(): Promise<Track[]> {
        return this.activeLibrary().getTracks();
    }
    getArtists(): Promise<Artist[]> {
        return this.activeLibrary().getArtists();
    }
    getAlbumArtists(): Promise<Artist[]> {
        return this.activeLibrary().getAlbumArtists();
    }
    getAlbums(): Promise<Album[]> {
        return this.activeLibrary().getAlbums();
    }

    getAlbumsOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Album[]> {
        return this.activeLibrary().getAlbumsOfArtist(
            artistId,
            includeFeatured
        );
    }
    getTracksOfArtist(
        artistId: string,
        includeFeatured: boolean
    ): Promise<Track[]> {
        return this.activeLibrary().getTracksOfArtist(
            artistId,
            includeFeatured
        );
    }
    getTracksOfAlbum(albumId: string): Promise<Track[]> {
        return this.activeLibrary().getTracksOfAlbum(albumId);
    }
    getTrackById(trackId: string): Promise<Track | null> {
        return this.activeLibrary().getTrackById(trackId);
    }

    getTrackArtUrl(track: Track, size?: number): string | null {
        return this.activeLibrary().getTrackArtUrl(track, size);
    }

    search(searchText: string): Promise<LibraryItem[]> {
        return this.activeLibrary().search(searchText);
    }

    getPlaybackUrl(track: Track, requestId: string): string {
        if (isMock()) {
            return silenceOgg;
        }
        return this.activeLibrary().getPlaybackUrl(track, requestId);
    }

    getTracksByIds(trackIds: string[]): Promise<Track[]> {
        return this.activeLibrary().getTracksByIds(trackIds);
    }

    getChildTracks(item: ItemStub): Promise<Track[]> {
        return getChildTracks(item, this.activeLibrary());
    }

    lookupPlaybackReporter(track: Track): MediaServerReporter | null {
        const server = this.serverManager.activeServerById(track.serverId);
        if (!server) {
            console.error(
                'Could not report playback for track with unknown server',
                track
            );
            return null;
        }
        return server.reporter();
    }

    reportPlaybackStart(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.trackStarted(state);
    }

    reportPlaybackProgress(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.trackProgress(state);
    }

    reportPlaybackFinished(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.trackFinished(state);
    }

    reportRepeatChanged(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.repeatModeChanged(state);
    }

    reportShuffleChanged(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.shuffleModeChanged(state);
    }

    reportPaused(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.paused(state);
    }

    reportResumed(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.resumed(state);
    }

    reportMutedToggled(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.mutedToggled(state);
    }

    reportVolumeChange(track: Track, state: PlaybackState): void {
        this.lookupPlaybackReporter(track)?.volumeChanged(state);
    }
}
