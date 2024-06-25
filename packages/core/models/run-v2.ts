/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.26.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { RunV2StepRunsInner } from "./run-v2-step-runs-inner";

/**
 *
 * @export
 * @interface RunV2
 */
export interface RunV2 {
  /**
   * The ID of the run
   * @type {string}
   * @memberof RunV2
   */
  id: string;
  /**
   *
   * @type {Array<RunV2StepRunsInner>}
   * @memberof RunV2
   */
  stepRuns: Array<RunV2StepRunsInner>;
}
