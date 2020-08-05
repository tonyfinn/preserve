const UNKNOWN_ARTIST_NAME = 'Unknown Artist';
const UNKNOWN_ALBUM_NAME = 'Unknown Album';

export default class Library {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.serverId = this.connectionManager.getLastUsedServer().Id;
        this.apiClient = this.connectionManager.getOrCreateApiClient(this.serverId);
        const userId = this.apiClient.getCurrentUserId();
        this.loaded = false;
        this.tracks = [];
        this.albums = [];
        this.artists = [];
        const artistLoading = this.apiClient.getArtists(userId)
            .then(artistsResult => artistsResult.Items.map(this.mapArtist));
        const albumLoading = this.apiClient.getItems(userId, {recursive: true, IncludeItemTypes: "MusicAlbum"})
            .then(albumResult => albumResult.Items.map(this.mapAlbum));
        const trackLoading = this.apiClient.getItems(userId, {recursive: true, IncludeItemTypes: "Audio"})
            .then(trackResult => trackResult.Items.map(this.mapTrack));

        this.loadingPromise = Promise.all([artistLoading, albumLoading, trackLoading])
            .then(([artists, albums, tracks]) => {
                this.artists = artists;
                this.albums = albums;
                this.tracks = tracks;

                this.buildSyntheticAlbums(tracks).forEach(album => this.albums.push(album));
                this.artistLookup = this.buildLookup(this.artists);
                this.albumLookup = this.buildLookup(this.albums);
                this.trackLookup = this.buildLookup(this.tracks);

                this.loaded = true;
            });
        
        window.library = this;
    }

    buildLookup(items) {
        const lookup = {};
        for(const item of items) {
            lookup[item.id] = item;
        }
        return lookup;
    }

    buildSyntheticAlbums(tracks) {
        const syntheticAlbums = {};
        for(const track of tracks) {
            if(!track.album.id) {
                const primaryArtistId = track.albumArtists.entries().next().value || UNKNOWN_ARTIST_NAME;
                const albumName = track.album.name || UNKNOWN_ALBUM_NAME;
                track.album.id = `synth-${primaryArtistId}-${albumName}`;
                if(!syntheticAlbums[track.album.id]) {
                    const album = this.albumFromTrack(track);
                    syntheticAlbums[track.album.id] = album;
                }
            }
        }
        return Object.values(syntheticAlbums);
    }

    buildArtistSearchItems(artists) {

        const searchItems = [];
        for (const artist of artists) {
            const searchText = [
                artist.name, 
            ].join(' ');
            searchItems.push({
                searchText,
                type: 'artist',
                id: artist.id,
            });
        }
        return searchItems;
    }

    mapArtist(artist) {
        return {
            id: artist.Id,
            name: artist.Name,
            serverId: artist.ServerId,
            type: 'artist',
        };
    }

    mapAlbum(album) {
        return {
            id: album.Id,
            name: album.Name,
            serverId: album.ServerId,
            albumArtists: new Set(album.AlbumArtists.map(aa => ({
                id: aa.Id,
                name: aa.Name || UNKNOWN_ARTIST_NAME,
            }))),
            artists: new Set(album.ArtistItems.map(aa => ({
                id: aa.Id,
                name: aa.Name || UNKNOWN_ARTIST_NAME,
            }))),
            albumArtId: album.ImageTags.Primary,
            year: album.ProductionYear,
            type: 'album',
            synthetic: false,
        };
    }

    albumFromTrack(track) {
        return {
            id: track.album.id,
            name: track.album.name,
            serverId: track.serverId,
            albumArtists: new Set(track.albumArtists),
            artists: new Set(track.artists),
            albumArtId: track.albumArtId,
            year: track.year,
            type: 'album',
            synthetic: true,
        }
    }

    mapTrack(track) {
        return {
            id: track.Id,
            name: track.Name,
            serverId: track.ServerId,
            artists: new Set(track.ArtistItems.map(artist => ({
                id: artist.Id,
                name: artist.Name || UNKNOWN_ARTIST_NAME,
            }))),
            trackNumber: track.IndexNumber,
            discNumber: track.ParentIndexNumber,
            albumArtists: new Set(track.AlbumArtists.map(aa => ({
                id: aa.Id,
                name: aa.Name || UNKNOWN_ARTIST_NAME,
            }))),
            albumArtId: track.AlbumPrimaryImageTag,
            year: track.ProductionYear,
            album: {
                id: track.AlbumId,
                name: track.Album || UNKNOWN_ALBUM_NAME,
            },
            type: 'track',
        };
    }

    async getArtists() {
        await this.loadingPromise;
        return this.artists;
    }

    async getAlbums() {
        await this.loadingPromise;
        return this.albums;
    }

    async getTracks() {
        await this.loadingPromise;
        return this.tracks;
    }
}