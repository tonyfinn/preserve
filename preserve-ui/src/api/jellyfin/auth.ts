import { Configuration, SystemApi, UserApi } from '@jellyfin/client-axios';
import { UNKNOWN_SERVER_NAME } from 'preserve-ui/src/common/constants';
import { MediaServerAuth } from '../interface';
import { JellyfinServer } from './server';
import { JellyfinServerDefinition } from './types';
import { buildAuthHeader, queryServerDefinition } from './utils';

export enum ConnectErrorEnum {
    NoAccessToken,
    NoUserId,
    FailedAuth,
    NetworkError,
    IncompatibleServer,
    InternalError,
    UnexpectedResponse,
}

export class ConnectError extends Error {
    constructor(message: string, readonly reason: ConnectErrorEnum) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = ConnectError.name;
    }
}

export class JellyfinServerAuth
    implements MediaServerAuth<JellyfinServerDefinition, JellyfinServer> {
    async reconnect(
        definition: JellyfinServerDefinition
    ): Promise<JellyfinServer> {
        if (!definition.accessToken) {
            return Promise.reject(
                new ConnectError(
                    'No saved access token, must log in again',
                    ConnectErrorEnum.NoAccessToken
                )
            );
        }
        if (!definition.userId) {
            return Promise.reject(
                new ConnectError(
                    'No saved user ID, must log in again',
                    ConnectErrorEnum.NoAccessToken
                )
            );
        }

        const authHeader = buildAuthHeader(definition.accessToken);

        const testApi = new SystemApi(
            new Configuration({
                basePath: definition.address,
                apiKey: authHeader,
            })
        );

        try {
            const sysInfo = await testApi.getSystemInfo();
            const id = sysInfo.data.Id || definition.address;
            return new JellyfinServer({
                id,
                ty: 'jellyfin',
                name:
                    sysInfo.data.ServerName || `${UNKNOWN_SERVER_NAME} - ${id}`,
                address: definition.address,
                userId: definition.userId,
                accessToken: definition.accessToken,
            });
        } catch (e) {
            if (e.response && e.response.status === 401) {
                if (e.response.status === 401) {
                    return Promise.reject(
                        new ConnectError(
                            'Authorization rejected - please login again',
                            ConnectErrorEnum.FailedAuth
                        )
                    );
                } else {
                    return Promise.reject(
                        new ConnectError(
                            `Could not connect to server, unexpected response ${e.response.status}`,
                            ConnectErrorEnum.UnexpectedResponse
                        )
                    );
                }
            } else if (e.request) {
                return Promise.reject(
                    new ConnectError(
                        'Could not connect to server: No response from server',
                        ConnectErrorEnum.NetworkError
                    )
                );
            } else {
                const message =
                    e instanceof Error ? e.message : JSON.stringify(e);
                return Promise.reject(
                    new ConnectError(
                        `Could not connect to server: ${message}`,
                        ConnectErrorEnum.InternalError
                    )
                );
            }
        }
    }

    async login(
        address: string,
        username: string,
        password: string
    ): Promise<JellyfinServer> {
        const authHeader = buildAuthHeader();
        const userApi = new UserApi(
            new Configuration({ basePath: address, apiKey: authHeader })
        );
        const serverInfo = await queryServerDefinition(address);
        const authResponse = await userApi.authenticateUserByName({
            authenticateUserByName: {
                Username: username,
                Pw: password,
            },
        });

        if (authResponse.status === 200) {
            const authResult = authResponse.data;
            const serverDefinition: JellyfinServerDefinition = {
                id: authResult.ServerId || address,
                ty: 'jellyfin',
                name: serverInfo.name,
                accessToken: authResult.AccessToken || undefined,
                userId: authResult.User?.Id,
                address,
            };
            return this.reconnect(serverDefinition);
        } else if (authResponse.status === 401) {
            return Promise.reject(
                new ConnectError(
                    `Invalid Authorization`,
                    ConnectErrorEnum.FailedAuth
                )
            );
        } else {
            return Promise.reject(
                new ConnectError(
                    `Unexpected response code: ${authResponse.status}`,
                    ConnectErrorEnum.UnexpectedResponse
                )
            );
        }
    }
}
