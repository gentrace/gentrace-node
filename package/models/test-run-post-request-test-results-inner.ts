/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.9.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { TestRunPostRequestTestResultsInnerOutputStepsInner } from "./test-run-post-request-test-results-inner-output-steps-inner";

/**
 *
 * @export
 * @interface TestRunPostRequestTestResultsInner
 */
export interface TestRunPostRequestTestResultsInner {
  /**
   * The ID of the test result
   * @type {string}
   * @memberof TestRunPostRequestTestResultsInner
   */
  id?: string | null;
  /**
   * The ID of the test case
   * @type {string}
   * @memberof TestRunPostRequestTestResultsInner
   */
  caseId: string;
  /**
   * The input data for the test case
   * @type {{ [key: string]: any; }}
   * @memberof TestRunPostRequestTestResultsInner
   */
  inputs: { [key: string]: any };
  /**
   * The returned outputs for the test case
   * @type {{ [key: string]: any; }}
   * @memberof TestRunPostRequestTestResultsInner
   */
  outputs?: { [key: string]: any };
  /**
   * Use outputs object instead.
   * @type {string}
   * @memberof TestRunPostRequestTestResultsInner
   * @deprecated
   */
  output?: string;
  /**
   * Use outputs.steps insteads.
   * @type {Array<TestRunPostRequestTestResultsInnerOutputStepsInner>}
   * @memberof TestRunPostRequestTestResultsInner
   * @deprecated
   */
  outputSteps?: Array<TestRunPostRequestTestResultsInnerOutputStepsInner> | null;
}
