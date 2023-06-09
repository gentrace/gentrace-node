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



/**
 * 
 * @export
 * @interface TestRunPostRequestTestResultsInnerOutputStepsInner
 */
export interface TestRunPostRequestTestResultsInnerOutputStepsInner {
    /**
     * The key of the step
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInnerOutputStepsInner
     */
    'key': string;
    /**
     * The output of the step
     * @type {string}
     * @memberof TestRunPostRequestTestResultsInnerOutputStepsInner
     */
    'output': string;
    /**
     * The inputs of the step
     * @type {{ [key: string]: string; }}
     * @memberof TestRunPostRequestTestResultsInnerOutputStepsInner
     */
    'inputs'?: { [key: string]: string; } | null;
}

