export type ItemType = 'artist' | 'album' | 'track';

export interface Item {
    id: string;
    serverId: string;
    type: ItemType;
    libraryProviderData?: { [name: string]: unknown };
}

export interface ItemStub {
    id: string;
    name: string;
    type: ItemType;
}

export interface Artist extends Item {
    name: string;
    synthetic: boolean;
    albums: Array<Album>;
    type: 'artist';
}

export interface HasArtists {
    artists: Array<ItemStub>;
    albumArtists: Array<ItemStub>;
}

export interface Album extends Item {
    name: string;
    synthetic: boolean;
    year?: number;
    artists: Array<ItemStub>;
    albumArtists: Array<ItemStub>;
    tracks: Array<Track>;
    type: 'album';
}

export interface Track extends Item {
    name: string;
    artists: Array<ItemStub>;
    albumArtists: Array<ItemStub>;
    genres: Array<string>;
    album: ItemStub;
    year?: number;
    trackNumber?: number;
    duration: number;
    discNumber?: number;
    type: 'track';
}

export type LibraryItem = Artist | Album | Track;

export type ItemLookup<T extends Item> = Map<string, T>;
