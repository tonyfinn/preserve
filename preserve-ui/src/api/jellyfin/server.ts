import {
    MediaServer,
    MediaServerLibrary,
    MediaServerReporter,
} from '../interface';
import { JellyfinApiClient } from './api-client';
import { JellyfinLibrary } from './library';
import { JellyfinReporter } from './reporter';
import { JellyfinServerDefinition, JELLYFIN_SERVER_TYPE } from './types';

export class JellyfinServer implements MediaServer {
    id: string;
    address: string;
    name: string;
    accessToken: string;
    userId: string;

    _library: JellyfinLibrary;

    constructor(def: Required<JellyfinServerDefinition>) {
        this.id = def.id;
        this.address = def.address;
        this.name = def.name;
        this.accessToken = def.accessToken;
        this.userId = def.userId;

        this._library = new JellyfinLibrary(this.apiClient(), def.userId);
    }

    reporter(): MediaServerReporter {
        return new JellyfinReporter(this.apiClient());
    }

    serverId(): string {
        return this.id;
    }

    apiClient(): JellyfinApiClient {
        return new JellyfinApiClient(this.address, this.accessToken);
    }

    async username(): Promise<string> {
        const userInfo = await this.apiClient().user().getUserById({
            userId: this.userId,
        });
        if (userInfo?.data?.Name) {
            return userInfo.data.Name;
        } else {
            throw new Error('No username returned from server');
        }
    }

    async serverName(): Promise<string> {
        return this.name;
    }

    async logout(): Promise<void> {
        await this.apiClient().session().reportSessionEnded();
    }

    library(): MediaServerLibrary {
        return this._library;
    }

    definition(): JellyfinServerDefinition {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            ty: JELLYFIN_SERVER_TYPE,
            userId: this.userId,
            accessToken: this.accessToken,
        };
    }
}
