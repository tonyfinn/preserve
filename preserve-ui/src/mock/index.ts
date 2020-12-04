import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ACCESS_TOKEN, TEST_SERVER_URL, TEST_USER_ID } from './data/shared';

interface Params {
    [name: string]: string;
}

const requireAuthHeader = {
    asymmetricMatch(headers: Params): boolean {
        const authHeader = headers['X-Emby-Authorization'];
        if (!authHeader) {
            console.log('Rejected: No auth header');
            return false;
        }
        if (!authHeader.startsWith('MediaBrowser')) {
            console.log('Rejected: Invalid auth header');
            return false;
        }
        if (!authHeader.includes(`Token="${ACCESS_TOKEN}"`)) {
            console.log('Rejected: No access token');
            return false;
        }
        return true;
    },
};

function matchSome(checkParams: Params) {
    console.log('Building matcher for ', checkParams);
    return {
        asymmetricMatch(providedParams: Params) {
            console.log('Trying to match');
            console.log(checkParams, providedParams);
            for (const [key, value] of Object.entries(checkParams)) {
                if (providedParams[key] !== value) {
                    return false;
                }
            }
            return true;
        },
    };
}

interface PaginationResult<T> {
    TotalRecordCount: number;
    StartIndex: number;
    Items: T[];
}

function paginateResult<T>(
    data: T[],
    simulatePageLimit?: number
): (config: AxiosRequestConfig) => [number, PaginationResult<T>] {
    return function (
        config: AxiosRequestConfig
    ): [number, PaginationResult<T>] {
        if (!config.url) {
            throw new Error('no url');
        }
        const params = new URL(config.url).searchParams;
        const mockedLimit = simulatePageLimit || 9999;
        const requestedLimit =
            params.get('Limit') || params.get('limit') || '9999';
        const actualLimit = Math.min(
            mockedLimit,
            parseInt(requestedLimit, 10),
            10
        );
        const startIndex =
            params.get('StartIndex') || params.get('startIndex') || '0';
        const numStartIndex = parseInt(startIndex, 10);
        let resultItems: T[] = [];
        if (numStartIndex < data.length) {
            const endIndex = Math.min(numStartIndex + actualLimit, data.length);
            resultItems = data.slice(numStartIndex, endIndex);
        }
        const response = {
            TotalRecordCount: data.length,
            StartIndex: numStartIndex,
            Items: resultItems,
        };
        return [200, response];
    };
}

function registerMockHandlers(data: any) {
    const mock = new MockAdapter(axios);
    mock.onGet(`${TEST_SERVER_URL}/System/Info/Public`).reply(
        200,
        data.systemInfoPublicResponse
    );
    mock.onPost(`${TEST_SERVER_URL}/Users/AuthenticateByName`).reply(
        async function (config) {
            const login = JSON.parse(config.data);
            console.log(login);
            if (login.Username === 'test' && login.Pw === 'password') {
                return [200, data.successfulAuthenticateByNameResponse];
            } else {
                return [401, { success: false }];
            }
        }
    );
    mock.onGet(
        `${TEST_SERVER_URL}/System/Info`,
        undefined,
        requireAuthHeader
    ).reply(200, data.systemInfoResponse);

    mock.onGet(
        `${TEST_SERVER_URL}/Users/${TEST_USER_ID}`,
        undefined,
        requireAuthHeader
    ).reply(200, data.testUserInfoResponse);

    mock.onGet(
        new RegExp(`${TEST_SERVER_URL}/Artists`),
        matchSome({ userId: TEST_USER_ID }),
        requireAuthHeader
    ).reply(paginateResult(data.artists, 10));

    mock.onGet(
        new RegExp(`${TEST_SERVER_URL}/Users/${TEST_USER_ID}/Items`),
        undefined,
        requireAuthHeader
    ).reply(function (
        config: AxiosRequestConfig
    ): [number, PaginationResult<any> | null] {
        if (!config.url) {
            return [500, null];
        }
        const params = new URL(config.url).searchParams;
        const itemTypes =
            params.get('IncludeItemTypes') ||
            params.get('includeItemTypes') ||
            '';
        if (itemTypes === 'MusicAlbum') {
            return paginateResult(data.albums, 20)(config);
        } else if (itemTypes === 'Audio') {
            return paginateResult(data.tracks, 300)(config);
        } else if (itemTypes === 'MusicArtist') {
            return paginateResult(data.artists, 10)(config);
        } else {
            return [500, null];
        }
    });
}

export async function initMocks(): Promise<void> {
    // Chunked async to prevent webpack needing to recompile the data every time you change config
    return import(/* webpackChunkName: "mock-data" */ './data').then((data) => {
        registerMockHandlers(data);
    });
}
