/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.27.0
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
 * @interface TestResultV2
 */
export interface TestResultV2 {
  /**
   * The unique identifier for the test result.
   * @type {string}
   * @memberof TestResultV2
   */
  id: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestResultV2
   */
  createdAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestResultV2
   */
  updatedAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof TestResultV2
   */
  archivedAt: number | null;
  /**
   * The unique identifier for the pipeline associated with the test result.
   * @type {string}
   * @memberof TestResultV2
   */
  pipelineId: string;
  /**
   * The branch that the test result was created from
   * @type {string}
   * @memberof TestResultV2
   */
  branch?: string | null;
  /**
   * The commit that the test result was created from
   * @type {string}
   * @memberof TestResultV2
   */
  commit?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof TestResultV2
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   * The name of the test result
   * @type {string}
   * @memberof TestResultV2
   */
  name?: string | null;
}
