/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.11.2
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { TestResult } from './test-result';
// May contain unused imports in some cases
// @ts-ignore
import { TestResultGet200ResponseStats } from './test-result-get200-response-stats';

/**
 * 
 * @export
 * @interface TestResultGet200Response
 */
export interface TestResultGet200Response {
    /**
     * 
     * @type {TestResult}
     * @memberof TestResultGet200Response
     */
    'testResult'?: TestResult;
    /**
     * 
     * @type {TestResultGet200ResponseStats}
     * @memberof TestResultGet200Response
     */
    'stats'?: TestResultGet200ResponseStats;
}

