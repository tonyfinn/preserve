/* tslint:disable */
/* eslint-disable */
/**
 * Jellyfin API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
import { Configuration } from '../configuration';
// Some imports not used depending on template conditions
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from '../base';
// @ts-ignore
import { ImageProviderInfo } from '../model';
// @ts-ignore
import { ImageType } from '../model';
// @ts-ignore
import { ProblemDetails } from '../model';
// @ts-ignore
import { RemoteImageResult } from '../model';
/**
 * RemoteImageApi - axios parameter creator
 * @export
 */
export const RemoteImageApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Downloads a remote image for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} type The image type.
         * @param {string} [imageUrl] The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        downloadRemoteImage: async (itemId: string, type: ImageType, imageUrl?: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'itemId' is not null or undefined
            if (itemId === null || itemId === undefined) {
                throw new RequiredError('itemId','Required parameter itemId was null or undefined when calling downloadRemoteImage.');
            }
            // verify required parameter 'type' is not null or undefined
            if (type === null || type === undefined) {
                throw new RequiredError('type','Required parameter type was null or undefined when calling downloadRemoteImage.');
            }
            const localVarPath = `/Items/{itemId}/RemoteImages/Download`
                .replace(`{${"itemId"}}`, encodeURIComponent(String(itemId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CustomAuthentication required
            if (configuration && configuration.apiKey) {
                const localVarApiKeyValue = typeof configuration.apiKey === 'function'
                    ? await configuration.apiKey("X-Emby-Authorization")
                    : await configuration.apiKey;
                localVarHeaderParameter["X-Emby-Authorization"] = localVarApiKeyValue;
            }

            if (type !== undefined) {
                localVarQueryParameter['type'] = type;
            }

            if (imageUrl !== undefined) {
                localVarQueryParameter['imageUrl'] = imageUrl;
            }


    
            const queryParameters = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                queryParameters.set(key, localVarQueryParameter[key]);
            }
            for (const key in options.query) {
                queryParameters.set(key, options.query[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(queryParameters)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Gets a remote image.
         * @param {string} imageUrl The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImage: async (imageUrl: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'imageUrl' is not null or undefined
            if (imageUrl === null || imageUrl === undefined) {
                throw new RequiredError('imageUrl','Required parameter imageUrl was null or undefined when calling getRemoteImage.');
            }
            const localVarPath = `/Images/Remote`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CustomAuthentication required
            if (configuration && configuration.apiKey) {
                const localVarApiKeyValue = typeof configuration.apiKey === 'function'
                    ? await configuration.apiKey("X-Emby-Authorization")
                    : await configuration.apiKey;
                localVarHeaderParameter["X-Emby-Authorization"] = localVarApiKeyValue;
            }

            if (imageUrl !== undefined) {
                localVarQueryParameter['imageUrl'] = imageUrl;
            }


    
            const queryParameters = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                queryParameters.set(key, localVarQueryParameter[key]);
            }
            for (const key in options.query) {
                queryParameters.set(key, options.query[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(queryParameters)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Gets available remote image providers for an item.
         * @param {string} itemId Item Id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImageProviders: async (itemId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'itemId' is not null or undefined
            if (itemId === null || itemId === undefined) {
                throw new RequiredError('itemId','Required parameter itemId was null or undefined when calling getRemoteImageProviders.');
            }
            const localVarPath = `/Items/{itemId}/RemoteImages/Providers`
                .replace(`{${"itemId"}}`, encodeURIComponent(String(itemId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CustomAuthentication required
            if (configuration && configuration.apiKey) {
                const localVarApiKeyValue = typeof configuration.apiKey === 'function'
                    ? await configuration.apiKey("X-Emby-Authorization")
                    : await configuration.apiKey;
                localVarHeaderParameter["X-Emby-Authorization"] = localVarApiKeyValue;
            }


    
            const queryParameters = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                queryParameters.set(key, localVarQueryParameter[key]);
            }
            for (const key in options.query) {
                queryParameters.set(key, options.query[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(queryParameters)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Gets available remote images for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} [type] The image type.
         * @param {number} [startIndex] Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @param {number} [limit] Optional. The maximum number of records to return.
         * @param {string} [providerName] Optional. The image provider to use.
         * @param {boolean} [includeAllLanguages] Optional. Include all languages.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImages: async (itemId: string, type?: ImageType, startIndex?: number, limit?: number, providerName?: string, includeAllLanguages?: boolean, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'itemId' is not null or undefined
            if (itemId === null || itemId === undefined) {
                throw new RequiredError('itemId','Required parameter itemId was null or undefined when calling getRemoteImages.');
            }
            const localVarPath = `/Items/{itemId}/RemoteImages`
                .replace(`{${"itemId"}}`, encodeURIComponent(String(itemId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CustomAuthentication required
            if (configuration && configuration.apiKey) {
                const localVarApiKeyValue = typeof configuration.apiKey === 'function'
                    ? await configuration.apiKey("X-Emby-Authorization")
                    : await configuration.apiKey;
                localVarHeaderParameter["X-Emby-Authorization"] = localVarApiKeyValue;
            }

            if (type !== undefined) {
                localVarQueryParameter['type'] = type;
            }

            if (startIndex !== undefined) {
                localVarQueryParameter['startIndex'] = startIndex;
            }

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (providerName !== undefined) {
                localVarQueryParameter['providerName'] = providerName;
            }

            if (includeAllLanguages !== undefined) {
                localVarQueryParameter['includeAllLanguages'] = includeAllLanguages;
            }


    
            const queryParameters = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                queryParameters.set(key, localVarQueryParameter[key]);
            }
            for (const key in options.query) {
                queryParameters.set(key, options.query[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(queryParameters)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * RemoteImageApi - functional programming interface
 * @export
 */
export const RemoteImageApiFp = function(configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Downloads a remote image for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} type The image type.
         * @param {string} [imageUrl] The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async downloadRemoteImage(itemId: string, type: ImageType, imageUrl?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await RemoteImageApiAxiosParamCreator(configuration).downloadRemoteImage(itemId, type, imageUrl, options);
            return (axios: AxiosInstance = globalAxios, basePath: string = BASE_PATH) => {
                const axiosRequestArgs = {...localVarAxiosArgs.options, url: basePath + localVarAxiosArgs.url};
                return axios.request(axiosRequestArgs);
            };
        },
        /**
         * 
         * @summary Gets a remote image.
         * @param {string} imageUrl The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getRemoteImage(imageUrl: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<any>> {
            const localVarAxiosArgs = await RemoteImageApiAxiosParamCreator(configuration).getRemoteImage(imageUrl, options);
            return (axios: AxiosInstance = globalAxios, basePath: string = BASE_PATH) => {
                const axiosRequestArgs = {...localVarAxiosArgs.options, url: basePath + localVarAxiosArgs.url};
                return axios.request(axiosRequestArgs);
            };
        },
        /**
         * 
         * @summary Gets available remote image providers for an item.
         * @param {string} itemId Item Id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getRemoteImageProviders(itemId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<ImageProviderInfo>>> {
            const localVarAxiosArgs = await RemoteImageApiAxiosParamCreator(configuration).getRemoteImageProviders(itemId, options);
            return (axios: AxiosInstance = globalAxios, basePath: string = BASE_PATH) => {
                const axiosRequestArgs = {...localVarAxiosArgs.options, url: basePath + localVarAxiosArgs.url};
                return axios.request(axiosRequestArgs);
            };
        },
        /**
         * 
         * @summary Gets available remote images for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} [type] The image type.
         * @param {number} [startIndex] Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @param {number} [limit] Optional. The maximum number of records to return.
         * @param {string} [providerName] Optional. The image provider to use.
         * @param {boolean} [includeAllLanguages] Optional. Include all languages.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getRemoteImages(itemId: string, type?: ImageType, startIndex?: number, limit?: number, providerName?: string, includeAllLanguages?: boolean, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<RemoteImageResult>> {
            const localVarAxiosArgs = await RemoteImageApiAxiosParamCreator(configuration).getRemoteImages(itemId, type, startIndex, limit, providerName, includeAllLanguages, options);
            return (axios: AxiosInstance = globalAxios, basePath: string = BASE_PATH) => {
                const axiosRequestArgs = {...localVarAxiosArgs.options, url: basePath + localVarAxiosArgs.url};
                return axios.request(axiosRequestArgs);
            };
        },
    }
};

/**
 * RemoteImageApi - factory interface
 * @export
 */
export const RemoteImageApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    return {
        /**
         * 
         * @summary Downloads a remote image for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} type The image type.
         * @param {string} [imageUrl] The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        downloadRemoteImage(itemId: string, type: ImageType, imageUrl?: string, options?: any): AxiosPromise<void> {
            return RemoteImageApiFp(configuration).downloadRemoteImage(itemId, type, imageUrl, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Gets a remote image.
         * @param {string} imageUrl The image url.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImage(imageUrl: string, options?: any): AxiosPromise<any> {
            return RemoteImageApiFp(configuration).getRemoteImage(imageUrl, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Gets available remote image providers for an item.
         * @param {string} itemId Item Id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImageProviders(itemId: string, options?: any): AxiosPromise<Array<ImageProviderInfo>> {
            return RemoteImageApiFp(configuration).getRemoteImageProviders(itemId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Gets available remote images for an item.
         * @param {string} itemId Item Id.
         * @param {ImageType} [type] The image type.
         * @param {number} [startIndex] Optional. The record index to start at. All items with a lower index will be dropped from the results.
         * @param {number} [limit] Optional. The maximum number of records to return.
         * @param {string} [providerName] Optional. The image provider to use.
         * @param {boolean} [includeAllLanguages] Optional. Include all languages.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRemoteImages(itemId: string, type?: ImageType, startIndex?: number, limit?: number, providerName?: string, includeAllLanguages?: boolean, options?: any): AxiosPromise<RemoteImageResult> {
            return RemoteImageApiFp(configuration).getRemoteImages(itemId, type, startIndex, limit, providerName, includeAllLanguages, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for downloadRemoteImage operation in RemoteImageApi.
 * @export
 * @interface RemoteImageApiDownloadRemoteImageRequest
 */
export interface RemoteImageApiDownloadRemoteImageRequest {
    /**
     * Item Id.
     * @type {string}
     * @memberof RemoteImageApiDownloadRemoteImage
     */
    readonly itemId: string

    /**
     * The image type.
     * @type {ImageType}
     * @memberof RemoteImageApiDownloadRemoteImage
     */
    readonly type: ImageType

    /**
     * The image url.
     * @type {string}
     * @memberof RemoteImageApiDownloadRemoteImage
     */
    readonly imageUrl?: string
}

/**
 * Request parameters for getRemoteImage operation in RemoteImageApi.
 * @export
 * @interface RemoteImageApiGetRemoteImageRequest
 */
export interface RemoteImageApiGetRemoteImageRequest {
    /**
     * The image url.
     * @type {string}
     * @memberof RemoteImageApiGetRemoteImage
     */
    readonly imageUrl: string
}

/**
 * Request parameters for getRemoteImageProviders operation in RemoteImageApi.
 * @export
 * @interface RemoteImageApiGetRemoteImageProvidersRequest
 */
export interface RemoteImageApiGetRemoteImageProvidersRequest {
    /**
     * Item Id.
     * @type {string}
     * @memberof RemoteImageApiGetRemoteImageProviders
     */
    readonly itemId: string
}

/**
 * Request parameters for getRemoteImages operation in RemoteImageApi.
 * @export
 * @interface RemoteImageApiGetRemoteImagesRequest
 */
export interface RemoteImageApiGetRemoteImagesRequest {
    /**
     * Item Id.
     * @type {string}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly itemId: string

    /**
     * The image type.
     * @type {ImageType}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly type?: ImageType

    /**
     * Optional. The record index to start at. All items with a lower index will be dropped from the results.
     * @type {number}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly startIndex?: number

    /**
     * Optional. The maximum number of records to return.
     * @type {number}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly limit?: number

    /**
     * Optional. The image provider to use.
     * @type {string}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly providerName?: string

    /**
     * Optional. Include all languages.
     * @type {boolean}
     * @memberof RemoteImageApiGetRemoteImages
     */
    readonly includeAllLanguages?: boolean
}

/**
 * RemoteImageApi - object-oriented interface
 * @export
 * @class RemoteImageApi
 * @extends {BaseAPI}
 */
export class RemoteImageApi extends BaseAPI {
    /**
     * 
     * @summary Downloads a remote image for an item.
     * @param {RemoteImageApiDownloadRemoteImageRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RemoteImageApi
     */
    public downloadRemoteImage(requestParameters: RemoteImageApiDownloadRemoteImageRequest, options?: any) {
        return RemoteImageApiFp(this.configuration).downloadRemoteImage(requestParameters.itemId, requestParameters.type, requestParameters.imageUrl, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Gets a remote image.
     * @param {RemoteImageApiGetRemoteImageRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RemoteImageApi
     */
    public getRemoteImage(requestParameters: RemoteImageApiGetRemoteImageRequest, options?: any) {
        return RemoteImageApiFp(this.configuration).getRemoteImage(requestParameters.imageUrl, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Gets available remote image providers for an item.
     * @param {RemoteImageApiGetRemoteImageProvidersRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RemoteImageApi
     */
    public getRemoteImageProviders(requestParameters: RemoteImageApiGetRemoteImageProvidersRequest, options?: any) {
        return RemoteImageApiFp(this.configuration).getRemoteImageProviders(requestParameters.itemId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Gets available remote images for an item.
     * @param {RemoteImageApiGetRemoteImagesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RemoteImageApi
     */
    public getRemoteImages(requestParameters: RemoteImageApiGetRemoteImagesRequest, options?: any) {
        return RemoteImageApiFp(this.configuration).getRemoteImages(requestParameters.itemId, requestParameters.type, requestParameters.startIndex, requestParameters.limit, requestParameters.providerName, requestParameters.includeAllLanguages, options).then((request) => request(this.axios, this.basePath));
    }
}
