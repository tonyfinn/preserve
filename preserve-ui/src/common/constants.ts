import { isMock } from './utils';

export const ITEM_STUB_MIME_TYPE = 'application/x-preserve-library-item-stub';
export const UNKNOWN_ARTIST_NAME = 'Unknown Artist';
export const UNKNOWN_ALBUM_NAME = 'Unknown Album';
export const UNKNOWN_TRACK_NAME = 'Unknown Track';
export const UNKNOWN_SERVER_NAME = 'Unknown Server';

export const STORAGE_KEY_PREFIX = isMock() ? 'preserve_mock' : 'preserve';
export const STORAGE_KEY_LEGACY_SERVERS = `${STORAGE_KEY_PREFIX}_auth`;
export const STORAGE_KEY_SERVERS = `${STORAGE_KEY_PREFIX}_servers`;
