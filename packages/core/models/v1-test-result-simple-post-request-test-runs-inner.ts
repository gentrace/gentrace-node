/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.24.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface V1TestResultSimplePostRequestTestRunsInner
 */
export interface V1TestResultSimplePostRequestTestRunsInner {
  /**
   * The ID of the test run
   * @type {string}
   * @memberof V1TestResultSimplePostRequestTestRunsInner
   */
  id?: string | null;
  /**
   * The ID of the test case
   * @type {string}
   * @memberof V1TestResultSimplePostRequestTestRunsInner
   */
  caseId: string;
  /**
   * The input data for the test case
   * @type {{ [key: string]: any; }}
   * @memberof V1TestResultSimplePostRequestTestRunsInner
   */
  inputs: { [key: string]: any };
  /**
   * The returned outputs for the test case
   * @type {{ [key: string]: any; }}
   * @memberof V1TestResultSimplePostRequestTestRunsInner
   */
  outputs?: { [key: string]: any };
}
