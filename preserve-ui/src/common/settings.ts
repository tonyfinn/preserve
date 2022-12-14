import { LibraryGroupOption } from '../library';
import { RepeatMode, ShuffleMode } from '../player';
import { PlayColumn } from '../queues/columns';
import { STORAGE_KEY_PREFIX } from './constants';

export const STORAGE_KEY_SETTINGS = `${STORAGE_KEY_PREFIX}_settings`;

export class Settings {
    libraryGrouping: LibraryGroupOption;
    playlistColumns: Array<PlayColumn>;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    volume: number;

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
        this.shuffleMode = savedSettings.shuffleMode || ShuffleMode.Off;
        this.repeatMode = savedSettings.repeatMode || RepeatMode.Off;
        this.volume = savedSettings.volume || 1;
    }

    set<K extends keyof Settings>(k: K, v: this[K]): void {
        this[k] = v;
        this.save();
    }

    save(): void {
        window.localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this));
    }
}
