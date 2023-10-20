/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.18.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface CreateSingleTestCase
 */
export interface CreateSingleTestCase {
  /**
   * Slug for the pipeline
   * @type {string}
   * @memberof CreateSingleTestCase
   */
  pipelineSlug?: string;
  /**
   * The name of the test case
   * @type {string}
   * @memberof CreateSingleTestCase
   */
  name?: string;
  /**
   * The input data for the test case as a JSON object
   * @type {{ [key: string]: any; }}
   * @memberof CreateSingleTestCase
   */
  inputs?: { [key: string]: any };
  /**
   * The expected outputs for the test case as a JSON object
   * @type {object}
   * @memberof CreateSingleTestCase
   */
  expectedOutputs?: object | null;
}
