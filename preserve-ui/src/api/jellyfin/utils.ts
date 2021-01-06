import {
    getClientName,
    getOrGenerateClientId,
} from '../../../src/common/client';
import {
    STORAGE_KEY_LEGACY_SERVERS,
    UNKNOWN_SERVER_NAME,
} from '../../../src/common/constants';
import { JellyfinApiClient } from './jf-client';
import {
    isRemoteServer,
    LegacySavedServer,
    LegacyServerInfo,
    JellyfinServerDefinition,
} from './types';

export async function queryServerDefinition(
    url: string
): Promise<JellyfinServerDefinition> {
    const api = new JellyfinApiClient(url);
    const sysInfo = await api.publicSystem().getPublicSystemInfo();

    const serverId = sysInfo.data.Id;

    if (!serverId) {
        throw new Error('Server missing ID - cannot connect');
    }

    return {
        id: serverId,
        ty: 'jellyfin',
        name: sysInfo.data.ServerName || `${UNKNOWN_SERVER_NAME} - ${serverId}`,
        address: url,
    };
}

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

export function buildAuthHeader(accessToken?: string): string {
    const deviceId = getOrGenerateClientId();
    const deviceName = getClientName();
    let tokenString = '';
    if (accessToken) {
        tokenString = `, Token="${accessToken}"`;
    }
    return `MediaBrowser Client="${APP_NAME}", Device="${deviceName}", DeviceId="${deviceId}", Version="${APP_VERSION}"${tokenString}`;
}
