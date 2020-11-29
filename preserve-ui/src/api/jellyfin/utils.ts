import { Configuration, SystemApi } from 'jellyfin-axios-client';
import {
    getClientName,
    getOrGenerateClientId,
} from 'preserve-ui/src/common/client';
import { STORAGE_KEY_LEGACY_SERVERS } from 'preserve-ui/src/common/constants';
import {
    isRemoteServer,
    LegacySavedServer,
    LegacyServerInfo,
    ServerDefinition,
} from './types';

const STORAGE_KEY_SERVERS = 'preserve_servers';

export async function queryServerDefinition(
    url: string
): Promise<ServerDefinition> {
    const api = new SystemApi(new Configuration(), url);
    const sysInfo = await api.getPublicSystemInfo();

    if (!sysInfo.data.Id) {
        throw new Error('Server missing ID - cannot connect');
    }

    return {
        id: sysInfo.data.Id,
        name: sysInfo.data.ServerName || undefined,
        address: url,
    };
}

export function getCachedServers(): Array<ServerDefinition> {
    const servers = [];

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
                    address: si.RemoteAddress || 'unknown',
                    name: si.Name,
                    accessToken: si.AccessToken || undefined,
                    userId: si.UserId || undefined,
                });
            }
        }
    }

    const newServerJson = window.localStorage.getItem(STORAGE_KEY_SERVERS);

    if (newServerJson) {
        const newServers = JSON.parse(newServerJson) as Array<ServerDefinition>;
        for (const serverDef of newServers) {
            servers.push(serverDef);
        }
    }

    return servers;
}

export function buildAuthHeader(accessToken: string): string {
    const deviceId = getOrGenerateClientId();
    const deviceName = getClientName();
    return `MediaBrowser Client="${APP_NAME}", Device="${deviceName}", DeviceId="${deviceId}", Version="${APP_VERSION}", Token="${accessToken}"`;
}
