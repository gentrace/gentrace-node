/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.8.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { TestRunPostRequestTestResultsInnerStepsInner } from './test-run-post-request-test-results-inner-steps-inner';

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
    'id'?: string | null;
    /**
     * The ID of the test case
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'caseId': string;
    /**
     * The input data for the test case
     * @type {{ [key: string]: string; }}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'inputs': { [key: string]: string; };
    /**
     * The expected output for the test case
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'output': string;
    /**
     * 
     * @type {Array<TestRunPostRequestTestResultsInnerStepsInner>}
     * @memberof TestRunPostRequestTestResultsInner
     */
    'steps'?: Array<TestRunPostRequestTestResultsInnerStepsInner> | null;
}

