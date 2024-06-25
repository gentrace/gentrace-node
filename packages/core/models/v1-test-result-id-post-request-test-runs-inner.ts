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
import { MetadataValueObject } from "./metadata-value-object";
// May contain unused imports in some cases
// @ts-ignore
import { StepRun } from "./step-run";

/**
 *
 * @export
 * @interface V1TestResultIdPostRequestTestRunsInner
 */
export interface V1TestResultIdPostRequestTestRunsInner {
  /**
   * The ID of the test run
   * @type {string}
   * @memberof V1TestResultIdPostRequestTestRunsInner
   */
  id?: string | null;
  /**
   * The ID of the test case
   * @type {string}
   * @memberof V1TestResultIdPostRequestTestRunsInner
   */
  caseId: string;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof V1TestResultIdPostRequestTestRunsInner
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   *
   * @type {Array<StepRun>}
   * @memberof V1TestResultIdPostRequestTestRunsInner
   */
  stepRuns: Array<StepRun>;
}