import { getChildTracks, MediaServerLibrary } from '../api';
import { ServerManager } from '../common/servers';
import { Album, Artist, ItemStub, LibraryItem, Track } from './types';

import silenceOgg from '../../static/silence.ogg';
import { isMock } from '../common/utils';
import { MediaServerReporter, PlaybackState } from '../api/interface';

export class LibraryManager {
    constructor(private readonly serverManager: ServerManager) {}

    private activeLibrary(): MediaServerLibrary {
        return this.serverManager.activeServers()[0].library();
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
