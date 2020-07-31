export default class Library {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.serverId = this.connectionManager.getLastUsedServer().Id;
        this.apiClient = this.connectionManager.getOrCreateApiClient(this.serverId);
        const userId = this.apiClient.getCurrentUserId();
        this.artists = this.apiClient.getArtists(userId).then((serverArtists) => serverArtists.Items.map(artist => ({
            id: artist.Id,
            name: artist.Name,
            serverId: artist.serverId,
            type: 'artist',
        })));
        this.albumArtists = this.apiClient.getAlbumArtists(userId).then((serverArtists) => serverArtists.Items.map(artist => ({
            id: artist.Id,
            name: artist.Name,
            serverId: artist.serverId,
            type: 'albumArtist',
        })));
        this.albums = this.apiClient.getItems(userId, {recursive: true, IncludeItemTypes: "MusicAlbum"}).then(albumResult => albumResult.Items.map(album => ({
            id: album.Id,
            name: album.Name,
            serverId: album.serverId,
            albumArtists: album.AlbumArtists.map(aa => ({
                id: aa.Id,
                name: aa.Name,
            })),
            artists: album.ArtistItems.map(aa => ({
                id: aa.Id,
                name: aa.Name,
            })),
            albumArtId: album.ImageTags.Primary,
            year: album.ProductionYear,
            type: 'album',
        })));
        this.tracks = this.apiClient.getItems(userId, {recursive: true, IncludeItemTypes: "Audio"}).then(trackResult => trackResult.Items.map(track => ({
            id: track.Id,
            name: track.Name,
            artists: track.Artists.map(artist => ({
                id: artist.Id,
                name: artist.Name,
            })),
            trackNumber: track.IndexNumber,
            discNumber: track.ParentIndexNumber,
            albumArtists: track.AlbumArtists.map(aa => ({
                id: aa.Id,
                name: aa.Name,
            })),
            album: {
                id: track.AlbumId,
                name: track.Album,
            },
            type: 'track',
        })));
        window.library = this;
    }

    async getArtists() {
        return this.artists;
    }

    async getAlbums() {
        return this.albums;
    }

    async getAlbumArtists() {
        return this.albumArtists;
    }

    async getTracks() {
        return this.tracks;
    }
}