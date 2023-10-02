/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.15.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface CreateMultipleTestCasesTestCasesInner
 */
export interface CreateMultipleTestCasesTestCasesInner {
  /**
   * Name of the test case.
   * @type {string}
   * @memberof CreateMultipleTestCasesTestCasesInner
   */
  name: string;
  /**
   * Input for the test case. Must be a valid JSON object and not an array.
   * @type {{ [key: string]: any; }}
   * @memberof CreateMultipleTestCasesTestCasesInner
   */
  inputs: { [key: string]: any };
  /**
   * Expected outputs for the test case
   * @type {object}
   * @memberof CreateMultipleTestCasesTestCasesInner
   */
  expectedOutputs: object;
}
