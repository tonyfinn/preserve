import { LibraryGroupOption } from '../library';
import { PlayColumn } from '../queues/columns';

export const SETTINGS_STORAGE_KEY = 'preserve_settings';

export class Settings {
    libraryGrouping: LibraryGroupOption;
    playlistColumns: Array<PlayColumn>;

    constructor(savedSettings: Partial<Settings>) {
        this.libraryGrouping =
            savedSettings.libraryGrouping ||
            LibraryGroupOption.AlbumArtist_Album;
        this.playlistColumns = savedSettings.playlistColumns || [
            PlayColumn.Title,
            PlayColumn.Artist,
            PlayColumn.Album,
        ];
    }
}
