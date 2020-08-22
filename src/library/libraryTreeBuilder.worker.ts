import { TreeItem } from "../tree/tree-item";
import { Track, Album, LibraryItem, Artist } from "./library";

function sortTracks(a: TreeItem<Track>, b: TreeItem<Track>): number {
    const aDisc = a.data.discNumber || -1;
    const bDisc = b.data.discNumber || -1;
    const aTrack = a.data.trackNumber || -1;
    const bTrack = b.data.trackNumber || -1;

    if (aDisc - bDisc != 0) {
        return aDisc - bDisc;
    }

    if (aTrack - bTrack != 0) {
        return aTrack - bTrack;
    }

    return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
}

function sortAlbums(a: TreeItem<Album>, b: TreeItem<Album>): number {
    const aYear = a.data.year;
    const bYear = b.data.year;

    if (aYear - bYear != 0) {
        return aYear - bYear;
    } else {
        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
    }
}

function artistTreeNode(
    artist: Artist,
    searchRegex: RegExp | null
): TreeItem<LibraryItem> {
    const children = [];
    let childMatch = false;
    const ownMatch = !searchRegex || searchRegex.test(artist.name);

    for (const album of artist.albums) {
        const albumNode = albumTreeNode(artist, album, ownMatch, searchRegex);
        children.push(albumNode);
        if (albumNode.visible) {
            childMatch = true;
        }
    }

    (children as Array<TreeItem<Album>>).sort(sortAlbums);

    return {
        id: artist.id,
        name: artist.name,
        isLeaf: false,
        expanded: false,
        selected: false,
        childrenSelected: false,
        data: artist,
        visible: ownMatch || childMatch,
        children,
    };
}

function albumTreeNode(
    artist: Artist,
    album: Album,
    parentMatch: boolean,
    searchRegex: RegExp | null
): TreeItem<LibraryItem> {
    const children = [];
    let childMatch = false;
    const ownMatch = !searchRegex || searchRegex.test(album.name);
    for (const track of album.tracks) {
        const trackNode = trackTreeNode(
            artist,
            album,
            track,
            parentMatch || ownMatch,
            searchRegex
        );
        children.push(trackNode);
        if (trackNode.visible) {
            childMatch = true;
        }
    }

    (children as Array<TreeItem<Track>>).sort(sortTracks);

    return {
        id: album.id,
        name: album.name,
        isLeaf: false,
        expanded: false,
        selected: false,
        childrenSelected: false,
        data: album,
        visible: parentMatch || ownMatch || childMatch,
        children: children,
    };
}

function trackTreeNode(
    artist: Artist,
    album: Album,
    track: Track,
    parentMatch: boolean,
    searchRegex: RegExp | null
): TreeItem<Track> {
    return {
        id: track.id,
        name: track.name,
        isLeaf: true,
        expanded: false,
        selected: false,
        childrenSelected: false,
        data: track,
        visible: parentMatch || !searchRegex || searchRegex.test(track.name),
    };
}

function treeViewFromLibrary(
    artists: Array<Artist>,
    searchRegex: RegExp | null
): Array<TreeItem<LibraryItem>> {
    console.time('buildLibraryTree');
    const tree = artists.map((artist) => artistTreeNode(artist, searchRegex));
    console.timeEnd('buildLibraryTree');
    return tree;
}

const ctx: Worker = self as unknown as Worker;

ctx.addEventListener('message', function (evt: MessageEvent) {
    if (!evt.data.artists) {
        console.log(evt);
        return;
    }
    const artists = evt.data.artists as Array<Artist>;
    const searchRegex = evt.data.searchRegex as RegExp | null;
    const tree = treeViewFromLibrary(artists, searchRegex);
    ctx.postMessage(tree);
})