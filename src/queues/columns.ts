import { ColumnDef, RowItem } from '../common/table';
import { formatTime } from '../common/utils';
import { albumArtistNames, artistNames } from '../library';
import { PlayQueueItem } from './play-queue';

export const PLAY_QUEUE_COLUMNS: Array<ColumnDef<PlayQueueItem>> = [
    {
        title: 'Disc Number',
        visible: false,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.discNumber
                ? '' + row.data.track.discNumber
                : '--';
        },
    },
    {
        title: 'Track Number',
        visible: false,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.trackNumber
                ? '' + row.data.track.trackNumber
                : '--';
        },
    },
    {
        title: 'Title',
        visible: true,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.name;
        },
    },
    {
        title: 'Artist',
        visible: true,
        renderer(row: RowItem<PlayQueueItem>): string {
            return artistNames(row.data.track);
        },
    },
    {
        title: 'Album Artist',
        visible: false,
        renderer(row: RowItem<PlayQueueItem>): string {
            return albumArtistNames(row.data.track);
        },
    },
    {
        title: 'Album',
        visible: true,
        renderer(row: RowItem<PlayQueueItem>): string {
            return row.data.track.album.name;
        },
    },
    {
        title: 'Duration',
        visible: false,
        renderer(row: RowItem<PlayQueueItem>): string {
            return formatTime(row.data.track.duration);
        },
    },
];
