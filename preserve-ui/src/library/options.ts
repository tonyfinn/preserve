export enum LibraryGroupOption {
    Artist_Album,
    AlbumArtist_Album,
    Artist,
    AlbumArtist,
    Album,
}

export const GROUP_OPTIONS = [
    {
        value: LibraryGroupOption.Artist_Album,
        label: 'Artist > Album',
    },
    {
        value: LibraryGroupOption.AlbumArtist_Album,
        label: 'Album Artist > Album',
    },
    { value: LibraryGroupOption.Artist, label: 'Artist' },
    {
        value: LibraryGroupOption.AlbumArtist,
        label: 'Album Artist',
        default: false,
    },
    { value: LibraryGroupOption.Album, label: 'Album' },
];
