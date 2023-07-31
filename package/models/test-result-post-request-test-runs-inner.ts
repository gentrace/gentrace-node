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
import { StepRun } from './step-run';

/**
 * 
 * @export
 * @interface TestResultPostRequestTestRunsInner
 */
export interface TestResultPostRequestTestRunsInner {
    /**
     * The ID of the test run
     * @type {string}
     * @memberof TestResultPostRequestTestRunsInner
     */
    'id'?: string | null;
    /**
     * The ID of the test case
     * @type {string}
     * @memberof TestResultPostRequestTestRunsInner
     */
    'caseId': string;
    /**
     * Use outputs.steps insteads.
     * @type {Array<StepRun>}
     * @memberof TestResultPostRequestTestRunsInner
     */
    'stepRuns': Array<StepRun>;
}

