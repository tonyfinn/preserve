import { Settings } from '../common/settings';
import { ColumnDef, RowItem } from '../common/table';
import { Column } from '../common/table/types';
import { formatTime } from '../common/utils';
import { albumArtistNames, artistNames } from '../library';
import { PlayQueueItem } from './play-queue';

export enum PlayColumn {
    DiscNumber,
    TrackNumber,
    Title,
    Artist,
    AlbumArtist,
    Album,
    Duration,
}

export const PLAY_QUEUE_COLUMNS: Array<ColumnDef<PlayColumn, PlayQueueItem>> = [
    {
        title: 'Disc Number',
        field: PlayColumn.DiscNumber,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.discNumber
                ? '' + row.data.track.discNumber
                : '--';
        },
    },
    {
        title: 'Track Number',
        field: PlayColumn.TrackNumber,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.trackNumber
                ? '' + row.data.track.trackNumber
                : '--';
        },
    },
    {
        title: 'Title',
        field: PlayColumn.Title,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.name;
        },
    },
    {
        title: 'Artist',
        field: PlayColumn.Artist,
        renderer(row: RowItem<PlayQueueItem>): string {
            return artistNames(row.data.track);
        },
    },
    {
        title: 'Album Artist',
        field: PlayColumn.AlbumArtist,
        renderer(row: RowItem<PlayQueueItem>): string {
            return albumArtistNames(row.data.track);
        },
    },
    {
        title: 'Album',
        field: PlayColumn.Album,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.album.name;
        },
    },
    {
        title: 'Duration',
        field: PlayColumn.Duration,
        renderer(row: RowItem<PlayQueueItem>): string {
            return formatTime(row.data.track.duration);
        },
    },
];

export function savedQueueColumns(
    settings: Settings
): Array<Column<PlayColumn, PlayQueueItem>> {
    const visibleColumns = settings.playlistColumns;
    return PLAY_QUEUE_COLUMNS.map(
        (def) => new Column(def, visibleColumns.includes(def.field))
    );
}
