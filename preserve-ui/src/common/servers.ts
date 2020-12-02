import { BaseServerDefinition, MediaServer } from '../api/interface';
import { getOldJellyfinServers, JellyfinServerAuth } from '../api/jellyfin';
import { JellyfinServerDefinition } from '../api/jellyfin/types';
import { STORAGE_KEY_SERVERS } from './constants';
import {
    NotificationService,
    NotificationType,
    NOTIFICATION_TIME_FOREVER,
    NOTIFICATION_TIME_SHORT,
} from './notifications';

export type ServerDefinition = JellyfinServerDefinition | BaseServerDefinition;

export function isJellyfinServer(
    s: ServerDefinition
): s is JellyfinServerDefinition {
    return s.ty === 'jellyfin';
}

export class ServerManager {
    private _activeServers: Array<MediaServer>;
    private _knownServers: Array<ServerDefinition>;

    constructor() {
        this._activeServers = [];
        this._knownServers = [];

        const legacyJellyfinServers = getOldJellyfinServers();
        for (const serverDef of legacyJellyfinServers) {
            this._knownServers.push(serverDef);
        }

        const savedServers = this.getSavedServers();
        for (const serverDef of savedServers) {
            this._knownServers.push(serverDef);
        }
    }

    private getSavedServers(): Array<ServerDefinition> {
        const savedServersJson = window.localStorage.getItem(
            STORAGE_KEY_SERVERS
        );
        if (!savedServersJson) {
            return [];
        }
        return JSON.parse(savedServersJson) as Array<ServerDefinition>;
    }

    knownServers(): Array<ServerDefinition> {
        return this._knownServers;
    }

    activeServers(): Array<MediaServer> {
        return this._activeServers;
    }

    async reconnect(): Promise<void> {
        const jellyfinAuth = new JellyfinServerAuth();
        for (const serverDef of this._knownServers) {
            if (isJellyfinServer(serverDef)) {
                try {
                    const server = await jellyfinAuth.reconnect(serverDef);
                    this._activeServers.push(server);
                    NotificationService.notify(
                        `Reconnected to ${serverDef.name}`,
                        NotificationType.Success,
                        NOTIFICATION_TIME_SHORT
                    );
                } catch (e) {
                    NotificationService.notify(
                        `Could not reconnect to ${serverDef.name} - ${e.message}`,
                        NotificationType.Error,
                        NOTIFICATION_TIME_FOREVER
                    );
                }
            }
        }
    }

    async logout(server: MediaServer): Promise<void> {
        await server.logout();
        this._activeServers = this._activeServers.filter(
            (s) => s.serverId() !== server.serverId()
        );
    }
}
