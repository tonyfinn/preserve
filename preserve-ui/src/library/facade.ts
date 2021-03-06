import { reactive } from 'vue';
import { Album, Artist, LibraryItem, Track } from '.';
import { LibraryLoadStage, LibraryLoadState, MediaServerLibrary } from '../api';
import {
    MediaServerLocalLibrary,
    MediaServerRemoteLibrary,
} from '../api/interface';

class ProxyLoadState {
    constructor(private readonly proxiedState: LibraryLoadState) {}

    get artistTotal() {
        return this.proxiedState.artistTotal;
    }

    get albumTotal() {
        return this.proxiedState.albumTotal;
    }

    get trackTotal() {
        return this.proxiedState.trackTotal;
    }

    get artistLoaded() {
        return this.proxiedState.artistLoaded;
    }

    get albumLoaded() {
        return this.proxiedState.albumLoaded;
    }

    get trackLoaded() {
        return this.proxiedState.trackLoaded;
    }

    get stage() {
        return this.proxiedState.stage === LibraryLoadStage.Loaded
            ? LibraryLoadStage.Loaded
            : LibraryLoadStage.Remote;
    }
}

export abstract class MediaServerLibraryFacade extends MediaServerLibrary {
    private _loadState: LibraryLoadState;
    constructor(
        protected readonly local: MediaServerLocalLibrary,
        protected readonly remote: MediaServerRemoteLibrary
    ) {
        super();
        this.local.populate();
        this._loadState = (reactive(
            new ProxyLoadState(this.local.loadState())
        ) as unknown) as LibraryLoadState;
    }

    private isRemote(): boolean {
        return this.loadState().stage === LibraryLoadStage.Remote;
    }

    protected activeLibrary(): MediaServerLibrary {
        return this.isRemote() ? this.remote : this.local;
    }

    loadState(): LibraryLoadState {
        return this._loadState;
    }

    getTracks(): Promise<Track[]> {
        return this.activeLibrary().getTracks();
    }

    getTrackArtUrl(track: Track, size?: number): string | null {
        return this.activeLibrary().getTrackArtUrl(track, size);
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
}
