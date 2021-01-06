import {
    ArtistsApi,
    Configuration,
    ItemsApi,
    SessionApi,
    SystemApi,
    UserApi,
} from '@jellyfin/client-axios';
import axios from 'axios';
import { JellyfinServerDefinition } from './types';
import { buildAuthHeader } from './utils';

export class JellyfinApiClient {
    constructor(public readonly address: string, public accessToken?: string) {}

    configuration(): Configuration {
        const authHeader = buildAuthHeader(this.accessToken);
        return new Configuration({
            basePath: this.address,
            apiKey: authHeader,
        });
    }

    artists(): ArtistsApi {
        return new ArtistsApi(this.configuration(), this.address, axios);
    }

    items(): ItemsApi {
        return new ItemsApi(this.configuration(), this.address, axios);
    }

    session(): SessionApi {
        return new SessionApi(this.configuration(), this.address, axios);
    }

    publicSystem(): SystemApi {
        return new SystemApi(new Configuration(), this.address, axios);
    }

    system(): SystemApi {
        return new SystemApi(this.configuration(), this.address, axios);
    }

    user(): UserApi {
        return new UserApi(this.configuration(), this.address, axios);
    }

    static fromDefinition(def: JellyfinServerDefinition): JellyfinApiClient {
        return new JellyfinApiClient(def.address, def.accessToken);
    }
}
