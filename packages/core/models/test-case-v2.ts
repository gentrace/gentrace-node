/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.24.2
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface TestCaseV2
 */
export interface TestCaseV2 {
  /**
   * The ID of the test case
   * @type {string}
   * @memberof TestCaseV2
   */
  id: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestCaseV2
   */
  createdAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestCaseV2
   */
  updatedAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestCaseV2
   */
  archivedAt: number | null;
  /**
   * The expected outputs for the test case
   * @type {object}
   * @memberof TestCaseV2
   */
  expectedOutputs?: object | null;
  /**
   * The input data for the test case as a JSON object
   * @type {{ [key: string]: any; }}
   * @memberof TestCaseV2
   */
  inputs: { [key: string]: any };
  /**
   * The name of the test case
   * @type {string}
   * @memberof TestCaseV2
   */
  name: string;
  /**
   * The ID of the pipeline that the test case belongs to
   * @type {string}
   * @memberof TestCaseV2
   */
  pipelineId: string;
}
