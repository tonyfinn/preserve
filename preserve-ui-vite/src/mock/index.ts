/* eslint-disable @typescript-eslint/no-explicit-any */

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

const missingHeader = {
    asymmetricMatch(headers: Params): boolean {
        return !requireAuthHeader.asymmetricMatch(headers);
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

function filterByObjectWithId(
    fieldName: string,
    filterIds: string[]
): (item: any) => boolean {
    return (item: any) => {
        if (!item[fieldName]) {
            return false;
        }
        const itemIds = [];

        for (const fieldWithId of item[fieldName]) {
            itemIds.push(fieldWithId.Id);
        }

        for (const id of filterIds) {
            if (itemIds.includes(id)) {
                return true;
            }
        }

        return false;
    };
}

function registerMockHandlers(data: any) {
    const mock = new MockAdapter(axios, { onNoMatch: 'throwException' });
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
        `${TEST_SERVER_URL}/System/Info`,
        undefined,
        missingHeader
    ).reply(401);

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

    mock.onPost(`${TEST_SERVER_URL}/Sessions/Playing`).reply(204);
    mock.onPost(`${TEST_SERVER_URL}/Sessions/Playing/Progress`).reply(204);
    mock.onPost(`${TEST_SERVER_URL}/Sessions/Playing/Stopped`).reply(204);

    mock.onGet(
        new RegExp(`${TEST_SERVER_URL}/Users/${TEST_USER_ID}/Items`),
        undefined,
        requireAuthHeader
    ).reply(function (
        config: AxiosRequestConfig
    ): Promise<[number, PaginationResult<any> | null]> {
        if (!config.url) {
            return Promise.resolve([500, null]);
        }
        const params = new URL(config.url).searchParams;
        const itemTypes =
            params.get('IncludeItemTypes') ||
            params.get('includeItemTypes') ||
            '';

        const filterFuncs: Array<(item: any) => boolean> = [];

        const searchTerm = params.get('searchTerm');
        if (searchTerm) {
            filterFuncs.push((item: any) =>
                item.Name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const idsString = params.get('ids');
        if (idsString) {
            const ids = idsString.split(',');
            filterFuncs.push((item: any) => ids?.includes(item.Id));
        }

        const artistIdsString = params.get('artistIds');
        if (artistIdsString) {
            const filterArtistIds = artistIdsString.split(',');
            filterFuncs.push(
                filterByObjectWithId('ArtistItems', filterArtistIds)
            );
        }

        const albumArtistIdsString = params.get('albumArtistIds');
        if (albumArtistIdsString) {
            const filterAlbumArtistIds = albumArtistIdsString.split(',');
            filterFuncs.push(
                filterByObjectWithId('AlbumArtists', filterAlbumArtistIds)
            );
        }

        const albumIdsString = params.get('albumIds');
        if (albumIdsString) {
            const filterAlbumIds = albumIdsString.split(',');
            filterFuncs.push((item: any) =>
                filterAlbumIds.includes(item.AlbumId)
            );
        }

        if (window.location.search.includes('neverLoad')) {
            const startIndex = params.get('startIndex');
            if (startIndex && parseInt(startIndex, 10) > 0) {
                console.log(startIndex);
                return new Promise(() => {
                    return;
                });
            }
        }

        let items: any[];
        let serverPageSize;
        if (itemTypes === 'MusicAlbum') {
            items = data.albums;
            serverPageSize = 20;
        } else if (itemTypes === 'Audio') {
            items = data.tracks;
            serverPageSize = 300;
        } else if (itemTypes === 'MusicArtist') {
            items = data.artists;
            serverPageSize = 10;
        } else {
            const splitItemTypes = itemTypes.split(',');
            items = [];
            for (const itemType of splitItemTypes) {
                if (itemType === 'MusicAlbum') {
                    items = items.concat(data.albums);
                } else if (itemType === 'Audio') {
                    items = items.concat(data.tracks);
                } else if (itemType === 'MusicArtist') {
                    items = items.concat(data.artists);
                } else {
                    console.error('Failing request', config);
                    return Promise.resolve([500, null]);
                }
            }
            serverPageSize = 50;
        }
        const filteredItems = items.filter((item: any) => {
            for (const filter of filterFuncs) {
                if (!filter(item)) {
                    return false;
                }
            }
            return true;
        });
        const paginatedItems = paginateResult(
            filteredItems,
            serverPageSize
        )(config);
        console.log('Returned mocked items', config, paginatedItems);
        return Promise.resolve(paginatedItems);
    });
}

export async function initMocks(): Promise<void> {
    // Chunked async to prevent webpack needing to recompile the data every time you change config
    return import(/* webpackChunkName: "mock-data" */ './data').then((data) => {
        console.log(data);
        registerMockHandlers(data);
    });
}
