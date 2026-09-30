export enum GroupingField {
    Genre,
    Artist,
    AlbumArtist,
    Album,
}

export enum LibraryGroupOption {
    Artist_Album,
    AlbumArtist_Album,
    Genre_Album,
    Genre_AlbumArtist,
    Genre_AlbumArtist_Album,
    Artist,
    AlbumArtist,
    Album,
}

export const GROUP_OPTIONS = [
    {
        value: LibraryGroupOption.Artist_Album,
        order: [GroupingField.Artist, GroupingField.Album],
        label: 'Artist > Album',
    },
    {
        value: LibraryGroupOption.AlbumArtist_Album,
        order: [GroupingField.AlbumArtist, GroupingField.Album],
        label: 'Album Artist > Album',
    },
    {
        value: LibraryGroupOption.Artist,
        order: [GroupingField.Artist],
        label: 'Artist',
    },
    {
        value: LibraryGroupOption.AlbumArtist,
        order: [GroupingField.AlbumArtist],
        label: 'Album Artist',
    },
    {
        value: LibraryGroupOption.Album,
        order: [GroupingField.Album],
        label: 'Album',
    },
    /*{
        value: LibraryGroupOption.Genre_Album,
        order: [GroupingField.Genre, GroupingField.Album],
        label: 'Genre > Album',
    },
    {
        value: LibraryGroupOption.Genre_AlbumArtist,
        order: [GroupingField.Genre, GroupingField.AlbumArtist],
        label: 'Genre > Album Artist',
    },
    {
        value: LibraryGroupOption.Genre_AlbumArtist_Album,
        order: [
            GroupingField.Genre,
            GroupingField.AlbumArtist,
            GroupingField.Album,
        ],
        label: 'Genre > Album Artist > Album',
    },*/
];
