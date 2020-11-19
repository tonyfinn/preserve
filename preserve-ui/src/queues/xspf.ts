import { PlayQueue, PlayQueueItem } from './play-queue';

function queueItemToXmlNode(
    doc: XMLDocument,
    queueItem: PlayQueueItem
): Element {
    const trackEl = doc.createElement('track');

    const identifierEl = doc.createElement('identifier');
    const identifier = `jellyfin:${queueItem.track.serverId}/${queueItem.track.id}`;
    identifierEl.appendChild(doc.createTextNode(identifier));
    trackEl.appendChild(identifierEl);

    const artistEl = doc.createElement('creator');
    const firstArtist = [...queueItem.track.artists.values()][0];
    artistEl.appendChild(doc.createTextNode(firstArtist.name));
    trackEl.appendChild(artistEl);

    const albumEl = doc.createElement('album');
    const album = queueItem.track.album;
    albumEl.appendChild(doc.createTextNode(album.name));
    trackEl.appendChild(albumEl);

    const durationEl = doc.createElement('duration');
    const duration = queueItem.track.duration;
    durationEl.appendChild(doc.createTextNode('' + duration));
    trackEl.appendChild(durationEl);

    return trackEl;
}

export default function queueToXspf(queue: PlayQueue): string {
    const playlistDoc = document.implementation.createDocument(
        'http://xspf.org/ns/0/',
        null,
        null
    );
    const playlistEl = playlistDoc.createElement('playlist');
    playlistDoc.appendChild(playlistEl);
    playlistEl.setAttribute('version', '1');

    const playlistTitle = playlistDoc.createElement('title');
    playlistTitle.appendChild(playlistDoc.createTextNode(queue.name));
    playlistEl.appendChild(playlistTitle);

    const tracklistEl = playlistDoc.createElement('tracklistEl');
    playlistEl.appendChild(tracklistEl);

    for (const queueItem of queue.queueItems) {
        tracklistEl.appendChild(queueItemToXmlNode(playlistDoc, queueItem));
    }

    return new XMLSerializer().serializeToString(playlistDoc);
}
