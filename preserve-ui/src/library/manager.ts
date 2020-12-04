import { getChildTracks, MediaServerLibrary } from '../api';
import { ServerManager } from '../common/servers';
import { Album, Artist, ItemStub, LibraryItem, Track } from './types';

import silenceOgg from '../../static/silence.ogg';
import { isMock } from '../common/utils';

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
        return this.activeLibrary().getArtists();
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

    getPlaybackUrl(track: Track): string {
        if (isMock()) {
            return silenceOgg;
        }
        return this.activeLibrary().getPlaybackUrl(track);
    }

    getTracksByIds(trackIds: string[]): Promise<Track[]> {
        return this.activeLibrary().getTracksByIds(trackIds);
    }

    getChildTracks(item: ItemStub): Promise<Track[]> {
        return getChildTracks(item, this.activeLibrary());
    }
}
