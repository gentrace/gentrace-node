/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.23.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { MetadataValueObject } from "./metadata-value-object";

/**
 *
 * @export
 * @interface TestResult
 */
export interface TestResult {
  /**
   * The unique identifier for the test result.
   * @type {string}
   * @memberof TestResult
   */
  id: string;
  /**
   * The date and time the test result was created.
   * @type {string}
   * @memberof TestResult
   */
  createdAt: string;
  /**
   * The date and time the test result was last updated.
   * @type {string}
   * @memberof TestResult
   */
  updatedAt: string;
  /**
   * The unique identifier for the pipeline associated with the test result.
   * @type {string}
   * @memberof TestResult
   */
  pipelineId: string;
  /**
   * The branch that the test result was created from
   * @type {string}
   * @memberof TestResult
   */
  branch?: string | null;
  /**
   * The commit that the test result was created from
   * @type {string}
   * @memberof TestResult
   */
  commit?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof TestResult
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   * The name of the test result
   * @type {string}
   * @memberof TestResult
   */
  name?: string | null;
}
