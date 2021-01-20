import {
    ArtistsApi,
    AuthenticationResult,
    Configuration,
    ItemsApi,
    PlaystateApi,
    SessionApi,
    SystemApi,
    UserApi,
} from '@jellyfin/client-axios';
import axios, { AxiosResponse } from 'axios';
import {
    getClientName,
    getOrGenerateClientId,
} from 'preserve-ui/src/common/client';
import { MediaServerTestResult } from '../interface';
import { JellyfinServerDefinition } from './types';

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
