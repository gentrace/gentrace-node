/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.5.0
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
     * The source code to test
     * @type {string}
     * @memberof TestRunPostRequest
     */
    'source': string;
    /**
     * 
     * @type {Array<TestRunPostRequestTestResultsInner>}
     * @memberof TestRunPostRequest
     */
    'testResults': Array<TestRunPostRequestTestResultsInner>;
}

