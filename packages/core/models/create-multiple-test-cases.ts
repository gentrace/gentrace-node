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

// May contain unused imports in some cases
// @ts-ignore
import { CreateMultipleTestCasesTestCasesInner } from "./create-multiple-test-cases-test-cases-inner";

/**
 *
 * @export
 * @interface CreateMultipleTestCases
 */
export interface CreateMultipleTestCases {
  /**
   * Slug for the pipeline
   * @type {string}
   * @memberof CreateMultipleTestCases
   */
  pipelineSlug?: string;
  /**
   *
   * @type {Array<CreateMultipleTestCasesTestCasesInner>}
   * @memberof CreateMultipleTestCases
   */
  testCases?: Array<CreateMultipleTestCasesTestCasesInner>;
}
