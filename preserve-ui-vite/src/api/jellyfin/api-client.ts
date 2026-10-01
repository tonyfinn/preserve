import {
    Api,
    Jellyfin,
} from '@jellyfin/sdk';
import {
    ArtistApi,
    AuthenticationApi,
    type AuthenticationResult,
    ItemLookupApi,
    LibraryApi,
    SessionApi,
    SystemApi,
    UserApi
} from '@jellyfin/sdk/lib/generated-client';
import {
    getArtistApi,
    getAuthenticationApi,
    getLibraryApi,
    getSessionApi,
    getSystemApi,
    getUserApi
} from '@jellyfin/sdk/lib/utils/api';
import axios, { type AxiosResponse } from 'axios';
import {
    getClientName,
    getOrGenerateClientId,
} from '../../common/client';
import { MediaServerTestResult } from '../interface';
import { type JellyfinServerDefinition } from './types';


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
            },
        });
        this.api = this.jellyfin.createApi(address, accessToken)
    }

    authorizationHeader(): string {
        return this.api.authorizationHeader;
    }

    auth(): AuthenticationApi {
        return getAuthenticationApi(this.api);
    }

    artists(): ArtistApi {
        return getArtistApi(this.api);
    }

    library(): LibraryApi {
        return getLibraryApi(this.api);
    }

    session(): SessionApi {
        return getSessionApi(this.api);
    }

    system(): SystemApi {
        return getSystemApi(this.api);
    }

    user(): UserApi {
        return getUserApi(this.api);
    }

    makeLoginRequest(
        username: string,
        password: string
    ): Promise<AxiosResponse<AuthenticationResult>> {
        return this.auth().authenticateUserByName(
            {
                authenticateUserByName: {
                    Username: username,
                    Pw: password,
                },
            }
        );
    }

    static async test(address: string): Promise<MediaServerTestResult> {
        try {
            const result = await new JellyfinApiClient(address)
                .system()
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
