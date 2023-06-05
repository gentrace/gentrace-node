/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.6.3
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface TestRunPostRequestTestResultsInner
 */
export interface TestRunPostRequestTestResultsInner {
    /**
     * The ID of the test result
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'id'?: string;
    /**
     * The ID of the test case
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'caseId': string;
    /**
     * The input data for the test case
     * @type {object}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'inputs': object;
    /**
     * The expected output for the test case
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'output': string;
}

