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
// May contain unused imports in some cases
// @ts-ignore
import { StepRun } from "./step-run";

/**
 *
 * @export
 * @interface V1TestResultPostRequestTestRunsInner
 */
export interface V1TestResultPostRequestTestRunsInner {
  /**
   * The ID of the test run
   * @type {string}
   * @memberof V1TestResultPostRequestTestRunsInner
   */
  id?: string | null;
  /**
   * The ID of the test case
   * @type {string}
   * @memberof V1TestResultPostRequestTestRunsInner
   */
  caseId: string;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof V1TestResultPostRequestTestRunsInner
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   * Use outputs.steps insteads.
   * @type {Array<StepRun>}
   * @memberof V1TestResultPostRequestTestRunsInner
   */
  stepRuns: Array<StepRun>;
}
