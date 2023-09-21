/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.12.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { TestResultSimplePostRequestTestRunsInner } from "./test-result-simple-post-request-test-runs-inner";

/**
 *
 * @export
 * @interface TestResultSimplePostRequest
 */
export interface TestResultSimplePostRequest {
  /**
   * The pipeline ID
   * @type {string}
   * @memberof TestResultSimplePostRequest
   */
  pipelineSlug?: string;
  /**
   * The branch that the test result was created from
   * @type {string}
   * @memberof TestResultSimplePostRequest
   */
  branch?: string | null;
  /**
   * The commit that the test result was created from
   * @type {string}
   * @memberof TestResultSimplePostRequest
   */
  commit?: string | null;
  /**
   * The name of the test result
   * @type {string}
   * @memberof TestResultSimplePostRequest
   */
  name?: string | null;
  /**
   *
   * @type {Array<TestResultSimplePostRequestTestRunsInner>}
   * @memberof TestResultSimplePostRequest
   */
  testRuns: Array<TestResultSimplePostRequestTestRunsInner>;
}
