import { PlayQueue } from './play-queue';

export default function queueToM3u(queue: PlayQueue): string {
    let m3u = '#EXTM3U\n';
    for (const queueItem of queue.queueItems) {
        const firstArtist = [...queueItem.track.artists.values()][0];
        const firstAlbumArtist = [...queueItem.track.albumArtists.values()][0];
        m3u += `#EXTINF:${queueItem.track.duration},${firstArtist.name} - ${queueItem.track.name}\n`;
        m3u += `#EXTALB:${queueItem.track.album.name}\n`;
        m3u += `#EXTART:${firstAlbumArtist.name}\n`;
        m3u += `jellyfin:${queueItem.track.serverId}/${queueItem.track.id}\n`;
    }
    return m3u;
}
