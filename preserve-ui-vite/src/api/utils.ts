import { sorted } from '../common/utils';
import { ItemStub, sortAlbums, sortTracks, Track } from '../library';
import { MediaServerLibrary } from './interface';

export async function getChildTracks(
    item: ItemStub,
    library: MediaServerLibrary
): Promise<Array<Track>> {
    const childTracks = [];
    if (item.type === 'track') {
        const track = await library.getTrackById(item.id);
        if (track) {
            childTracks.push(track);
        }
    } else if (item.type === 'album') {
        const albumTracks = await library.getTracksOfAlbum(item.id);
        for (const track of sorted(albumTracks, sortTracks)) {
            childTracks.push(track);
        }
    } else if (item.type === 'artist') {
        const albums = await library.getAlbumsOfArtist(item.id, false);

        const tracksByAlbum = await Promise.all(
            sorted(albums, sortAlbums).map((album) =>
                library.getTracksOfAlbum(album.id)
            )
        );
        for (const albumTracks of tracksByAlbum) {
            for (const track of albumTracks) {
                childTracks.push(track);
            }
        }
    }
    return childTracks;
}
