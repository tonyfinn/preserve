import { Configuration } from 'jellyfin-axios-client';
import { MediaServerLibrary } from '../interface';
import { JellyfinLibrary } from './library';
import { ServerDefinition } from './types';
import { buildAuthHeader } from './utils';

export class JellyfinServer {
    id: string;
    address: string;
    name: string;
    accessToken: string;
    userId: string;

    _library: JellyfinLibrary;

    constructor(def: Required<ServerDefinition>) {
        this.id = def.id;
        this.address = def.address;
        this.name = name;
        this.accessToken = def.accessToken;
        this.userId = def.userId;

        this._library = new JellyfinLibrary(
            this.apiConfiguration(),
            def.userId
        );
    }

    apiConfiguration(): Configuration {
        const authHeader = buildAuthHeader(this.accessToken);
        return new Configuration({
            basePath: this.address,
            apiKey: authHeader,
        });
    }

    library(): MediaServerLibrary {
        return this._library;
    }
}
