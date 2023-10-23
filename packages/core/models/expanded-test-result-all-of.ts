/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.22.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { ExpandedPipeline } from "./expanded-pipeline";
// May contain unused imports in some cases
// @ts-ignore
import { ExpandedTestRun } from "./expanded-test-run";

/**
 *
 * @export
 * @interface ExpandedTestResultAllOf
 */
export interface ExpandedTestResultAllOf {
  /**
   *
   * @type {ExpandedPipeline}
   * @memberof ExpandedTestResultAllOf
   */
  pipeline?: ExpandedPipeline;
  /**
   *
   * @type {Array<ExpandedTestRun>}
   * @memberof ExpandedTestResultAllOf
   */
  runs?: Array<ExpandedTestRun>;
}
