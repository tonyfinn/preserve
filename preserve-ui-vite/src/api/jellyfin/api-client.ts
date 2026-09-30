import {
    Api,
    Jellyfin,
} from '@jellyfin/sdk';
import {
    ArtistApi,
    type AuthenticationResult,
    Configuration,
    ItemLookupApi,
    PlaystateApi,
    SessionApi,
    SystemApi,
    UserApi
} from '@jellyfin/sdk/lib/generated-client';
import {
    getArtistApi
} from '@jellyfin/sdk/lib/utils/api';
import axios, { type AxiosResponse } from 'axios';
import {
    getClientName,
    getOrGenerateClientId,
} from '../../common/client';
import { MediaServerTestResult } from '../interface';
import { type JellyfinServerDefinition } from './types';

function buildAuthHeader(accessToken?: string): string {
    const deviceId = getOrGenerateClientId();
    const deviceName = getClientName();
    let tokenString = '';
    if (accessToken) {
        tokenString = `, Token="${accessToken}"`;
    }
    return `MediaBrowser Client="${APP_NAME}", Device="${deviceName}", DeviceId="${deviceId}", Version="${APP_VERSION}"${tokenString}`;
}

export class JellyfinApiClient {
    private jellyfin: Jellyfin;
    private api: Api;

    constructor(public readonly address: string, public accessToken?: string) {
        this.jellyfin = new Jellyfin({
            clientInfo: {
                name: APP_NAME,
                version: APP_VERSION
            },
            deviceInfo: {
                name: getClientName(),
                id: getOrGenerateClientId(),
            }
        });
        this.api = this.jellyfin.createApi(address);
    }

    configuration(): Configuration {
        const authHeader = buildAuthHeader(this.accessToken);
        return new Configuration({
            basePath: this.address,
            apiKey: authHeader,
        });
    }

    async artists(): Promise<ArtistApi> {
        return getArtistApi(this.api);
    }

    items(): ItemLookupApi {
        return new ItemsApi(this.configuration(), this.address, axios);
    }

    session(): SessionApi {
        return new SessionApi(this.configuration(), this.address, axios);
    }

    publicSystem(): SystemApi {
        return new SystemApi(new Configuration(), this.address, axios);
    }

    playstate(): PlaystateApi {
        return new PlaystateApi(this.configuration(), this.address, axios);
    }

    system(): SystemApi {
        return new SystemApi(this.configuration(), this.address, axios);
    }

    user(): UserApi {
        return new UserApi(this.configuration(), this.address, axios);
    }

    makeLoginRequest(
        username: string,
        password: string
    ): Promise<AxiosResponse<AuthenticationResult>> {
        return this.user().authenticateUserByName(
            {
                authenticateUserByName: {
                    Username: username,
                    Pw: password,
                },
            },
            {
                headers: {
                    'X-Emby-Authorization': buildAuthHeader(),
                },
            }
        );
    }

    static async test(address: string): Promise<MediaServerTestResult> {
        try {
            const result = await new JellyfinApiClient(address)
                .publicSystem()
                .getPublicSystemInfo();
            if (result.status === 200) {
                return MediaServerTestResult.Success;
            } else {
                return MediaServerTestResult.InvalidServer;
            }
        } catch {
            return MediaServerTestResult.NoServer;
        }
    }

    static fromDefinition(def: JellyfinServerDefinition): JellyfinApiClient {
        return new JellyfinApiClient(def.address, def.accessToken);
    }
}
