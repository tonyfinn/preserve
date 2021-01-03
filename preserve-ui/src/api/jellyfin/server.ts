import { Configuration, SessionApi, UserApi } from '@jellyfin/client-axios';
import {
    MediaServer,
    MediaServerLibrary,
    MediaServerReporter,
} from '../interface';
import { JellyfinLibrary } from './library';
import { JellyfinReporter } from './reporter';
import { JellyfinServerDefinition, JELLYFIN_SERVER_TYPE } from './types';
import { buildAuthHeader } from './utils';

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

        this._library = new JellyfinLibrary(
            this.apiConfiguration(),
            def.userId,
            this.accessToken
        );
    }

    reporter(): MediaServerReporter {
        return new JellyfinReporter(this.apiConfiguration());
    }

    serverId(): string {
        return this.id;
    }

    apiConfiguration(): Configuration {
        const authHeader = buildAuthHeader(this.accessToken);
        return new Configuration({
            basePath: this.address,
            apiKey: authHeader,
        });
    }

    async username(): Promise<string> {
        const userInfo = await new UserApi(this.apiConfiguration()).getUserById(
            {
                userId: this.userId,
            }
        );
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
        await new SessionApi(this.apiConfiguration()).reportSessionEnded();
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
