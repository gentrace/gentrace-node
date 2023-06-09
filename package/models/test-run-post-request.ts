/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.8.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { TestRunPostRequestTestResultsInner } from './test-run-post-request-test-results-inner';

/**
 * 
 * @export
 * @interface TestRunPostRequest
 */
export interface TestRunPostRequest {
    /**
     * The ID of the test case set to run
     * @type {string}
     * @memberof TestRunPostRequest
     */
    'setId': string;
    /**
     * The branch that the test run was created from
     * @type {string}
     * @memberof TestRunPostRequest
     */
    'branch'?: string | null;
    /**
     * The commit that the test run was created from
     * @type {string}
     * @memberof TestRunPostRequest
     */
    'commit'?: string | null;
    /**
     * The name of the test run
     * @type {string}
     * @memberof TestRunPostRequest
     */
    'name'?: string | null;
    /**
     * 
     * @type {Array<TestRunPostRequestTestResultsInner>}
     * @memberof TestRunPostRequest
     */
    'testResults': Array<TestRunPostRequestTestResultsInner>;
}

