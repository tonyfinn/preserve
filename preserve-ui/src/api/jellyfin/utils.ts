import {
    STORAGE_KEY_LEGACY_SERVERS,
    UNKNOWN_SERVER_NAME,
} from '../../../src/common/constants';
import {
    isRemoteServer,
    LegacySavedServer,
    LegacyServerInfo,
    JellyfinServerDefinition,
} from './types';

export function getOldJellyfinServers(): Array<JellyfinServerDefinition> {
    const servers: Array<JellyfinServerDefinition> = [];

    const oldServerJson = window.localStorage.getItem(
        STORAGE_KEY_LEGACY_SERVERS
    );
    if (oldServerJson) {
        const oldServers = JSON.parse(oldServerJson).Servers as Array<
            LegacySavedServer & LegacyServerInfo
        >;

        for (const si of oldServers) {
            if (isRemoteServer(si)) {
                servers.push({
                    id: si.Id,
                    ty: 'jellyfin',
                    address: si.RemoteAddress || 'unknown',
                    name: si.Name || `${UNKNOWN_SERVER_NAME} - ${si.Id}`,
                    accessToken: si.AccessToken || undefined,
                    userId: si.UserId || undefined,
                });
            }
        }
    }
    return servers;
}
