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


import { ForgotPasswordAction } from './forgot-password-action';

/**
 * 
 * @export
 * @interface ForgotPasswordResult
 */
export interface ForgotPasswordResult {
    /**
     * 
     * @type {ForgotPasswordAction}
     * @memberof ForgotPasswordResult
     */
    Action?: ForgotPasswordAction;
    /**
     * Gets or sets the pin file.
     * @type {string}
     * @memberof ForgotPasswordResult
     */
    PinFile?: string | null;
    /**
     * Gets or sets the pin expiration date.
     * @type {string}
     * @memberof ForgotPasswordResult
     */
    PinExpirationDate?: string | null;
}


