import { LibraryGroupOption } from '../library';
import { PlayColumn } from '../queues/columns';

export const SETTINGS_STORAGE_KEY = 'preserve_settings';

export class Settings {
    libraryGrouping: LibraryGroupOption;
    playlistColumns: Array<PlayColumn>;

    constructor(savedSettings: Partial<Settings>) {
        this.libraryGrouping =
            savedSettings.libraryGrouping !== undefined
                ? savedSettings.libraryGrouping
                : LibraryGroupOption.AlbumArtist_Album;
        this.playlistColumns = savedSettings.playlistColumns || [
            PlayColumn.Title,
            PlayColumn.Artist,
            PlayColumn.Album,
        ];
    }

    set<K extends keyof Settings>(k: K, v: this[K]): void {
        this[k] = v;
        this.save();
    }

    save(): void {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this));
    }
}
