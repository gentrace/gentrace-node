/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.7.0
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
// @ts-ignore
import { TestCaseGet200Response } from '../models';
// @ts-ignore
import { TestRunGet200Response } from '../models';
// @ts-ignore
import { TestRunPost200Response } from '../models';
// @ts-ignore
import { TestRunPostRequest } from '../models';
/**
 * CoreApi - axios parameter creator
 * @export
 */
export const CoreApiAxiosParamCreator = function (configuration?: Configuration) {
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
        /**
         * 
         * @summary Get test cases for a test set
         * @param {string} setId The ID of the test case set to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testCaseGet: async (setId: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'setId' is not null or undefined
            assertParamExists('testCaseGet', 'setId', setId)
            const localVarPath = `/test-case`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearerAuth required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (setId !== undefined) {
                localVarQueryParameter['setId'] = setId;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get test run by ID
         * @param {string} runId The ID of the test run to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testRunGet: async (runId: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'runId' is not null or undefined
            assertParamExists('testRunGet', 'runId', runId)
            const localVarPath = `/test-run`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication bearerAuth required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (runId !== undefined) {
                localVarQueryParameter['runId'] = runId;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Create a new test run from test results
         * @param {TestRunPostRequest} testRunPostRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testRunPost: async (testRunPostRequest: TestRunPostRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'testRunPostRequest' is not null or undefined
            assertParamExists('testRunPost', 'testRunPostRequest', testRunPostRequest)
            const localVarPath = `/test-run`;
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
            localVarRequestOptions.data = serializeDataIfNeeded(testRunPostRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * CoreApi - functional programming interface
 * @export
 */
export const CoreApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = CoreApiAxiosParamCreator(configuration)
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
        /**
         * 
         * @summary Get test cases for a test set
         * @param {string} setId The ID of the test case set to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async testCaseGet(setId: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<TestCaseGet200Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.testCaseGet(setId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get test run by ID
         * @param {string} runId The ID of the test run to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async testRunGet(runId: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<TestRunGet200Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.testRunGet(runId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Create a new test run from test results
         * @param {TestRunPostRequest} testRunPostRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async testRunPost(testRunPostRequest: TestRunPostRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<TestRunPost200Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.testRunPost(testRunPostRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * CoreApi - factory interface
 * @export
 */
export const CoreApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = CoreApiFp(configuration)
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
        /**
         * 
         * @summary Get test cases for a test set
         * @param {string} setId The ID of the test case set to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testCaseGet(setId: string, options?: any): AxiosPromise<TestCaseGet200Response> {
            return localVarFp.testCaseGet(setId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get test run by ID
         * @param {string} runId The ID of the test run to retrieve
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testRunGet(runId: string, options?: any): AxiosPromise<TestRunGet200Response> {
            return localVarFp.testRunGet(runId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Create a new test run from test results
         * @param {TestRunPostRequest} testRunPostRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        testRunPost(testRunPostRequest: TestRunPostRequest, options?: any): AxiosPromise<TestRunPost200Response> {
            return localVarFp.testRunPost(testRunPostRequest, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * CoreApi - object-oriented interface
 * @export
 * @class CoreApi
 * @extends {BaseAPI}
 */
export class CoreApi extends BaseAPI {
    /**
     * 
     * @summary Create a pipeline run
     * @param {PipelineRunRequest} pipelineRunRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoreApi
     */
    public pipelineRunPost(pipelineRunRequest: PipelineRunRequest, options?: AxiosRequestConfig) {
        return CoreApiFp(this.configuration).pipelineRunPost(pipelineRunRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get test cases for a test set
     * @param {string} setId The ID of the test case set to retrieve
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoreApi
     */
    public testCaseGet(setId: string, options?: AxiosRequestConfig) {
        return CoreApiFp(this.configuration).testCaseGet(setId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get test run by ID
     * @param {string} runId The ID of the test run to retrieve
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoreApi
     */
    public testRunGet(runId: string, options?: AxiosRequestConfig) {
        return CoreApiFp(this.configuration).testRunGet(runId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Create a new test run from test results
     * @param {TestRunPostRequest} testRunPostRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoreApi
     */
    public testRunPost(testRunPostRequest: TestRunPostRequest, options?: AxiosRequestConfig) {
        return CoreApiFp(this.configuration).testRunPost(testRunPostRequest, options).then((request) => request(this.axios, this.basePath));
    }
}
