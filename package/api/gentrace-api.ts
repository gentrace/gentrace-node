/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace Ingestion API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.1.9
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import type { Configuration } from '../configuration';
import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from '../common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from '../base';
// @ts-ignore
import { PipelineRunRequest } from '../models';
// @ts-ignore
import { PipelineRunResponse } from '../models';
/**
 * GentraceApi - axios parameter creator
 * @export
 */
export const GentraceApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Create a pipeline run
         * @param {PipelineRunRequest} pipelineRunRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pipelineRunPost: async (pipelineRunRequest: PipelineRunRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'pipelineRunRequest' is not null or undefined
            assertParamExists('pipelineRunPost', 'pipelineRunRequest', pipelineRunRequest)
            const localVarPath = `/pipeline-run`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearerAuth required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(pipelineRunRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * GentraceApi - functional programming interface
 * @export
 */
export const GentraceApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = GentraceApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Create a pipeline run
         * @param {PipelineRunRequest} pipelineRunRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pipelineRunPost(pipelineRunRequest: PipelineRunRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PipelineRunResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pipelineRunPost(pipelineRunRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * GentraceApi - factory interface
 * @export
 */
export const GentraceApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = GentraceApiFp(configuration)
    return {
        /**
         * 
         * @summary Create a pipeline run
         * @param {PipelineRunRequest} pipelineRunRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pipelineRunPost(pipelineRunRequest: PipelineRunRequest, options?: any): AxiosPromise<PipelineRunResponse> {
            return localVarFp.pipelineRunPost(pipelineRunRequest, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * GentraceApi - object-oriented interface
 * @export
 * @class GentraceApi
 * @extends {BaseAPI}
 */
export class GentraceApi extends BaseAPI {
    /**
     * 
     * @summary Create a pipeline run
     * @param {PipelineRunRequest} pipelineRunRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof GentraceApi
     */
    public pipelineRunPost(pipelineRunRequest: PipelineRunRequest, options?: AxiosRequestConfig) {
        return GentraceApiFp(this.configuration).pipelineRunPost(pipelineRunRequest, options).then((request) => request(this.axios, this.basePath));
    }
}
