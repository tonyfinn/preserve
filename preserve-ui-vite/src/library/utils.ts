import { UNKNOWN_ARTIST_NAME } from '../common/constants';
import { Artist, Album, Track } from './types';

export function sortTracks(a: Track, b: Track): number {
    const aDisc = a.discNumber || -1;
    const bDisc = b.discNumber || -1;
    const aTrack = a.trackNumber || -1;
    const bTrack = b.trackNumber || -1;

    if (aDisc - bDisc != 0) {
        return aDisc - bDisc;
    }

    if (aTrack - bTrack != 0) {
        return aTrack - bTrack;
    }

    return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
}

export function sortAlbums(a: Album, b: Album): number {
    const aYear = a.year || 0;
    const bYear = b.year || 0;

    if (aYear - bYear != 0) {
        return aYear - bYear;
    } else {
        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
    }
}

export function sortArtists(a: Artist, b: Artist): number {
    if (a.name === b.name) {
        return 0;
    } else if (a.name > b.name) {
        return 1;
    } else {
        return -1;
    }
}

export function artistNames(t: Track): string {
    if (t.artists && t.artists.length > 0) {
        return t.artists.map((a) => a.name).join('; ');
    }
    return UNKNOWN_ARTIST_NAME;
}

export function albumArtistNames(t: Track): string {
    if (t.albumArtists && t.albumArtists.length > 0) {
        return t.albumArtists.map((a) => a.name).join('; ');
    }
    return UNKNOWN_ARTIST_NAME;
}

export function genreNames(t: Track): string {
    if (t.genres && t.genres.length > 0) {
        return t.genres.join('; ');
    }
    return 'Unknown';
}
