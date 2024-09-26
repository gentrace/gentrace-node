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
import { V1TestResultSimplePostRequestTestRunsInner } from "./v1-test-result-simple-post-request-test-runs-inner";

/**
 *
 * @export
 * @interface V1TestResultSimplePostRequest
 */
export interface V1TestResultSimplePostRequest {
  /**
   * Slug for the pipeline
   * @type {string}
   * @memberof V1TestResultSimplePostRequest
   */
  pipelineSlug: string;
  /**
   * The branch that the test result was created from
   * @type {string}
   * @memberof V1TestResultSimplePostRequest
   */
  branch?: string | null;
  /**
   * The commit that the test result was created from
   * @type {string}
   * @memberof V1TestResultSimplePostRequest
   */
  commit?: string | null;
  /**
   * The name of the test result
   * @type {string}
   * @memberof V1TestResultSimplePostRequest
   */
  name?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof V1TestResultSimplePostRequest
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   *
   * @type {Array<V1TestResultSimplePostRequestTestRunsInner>}
   * @memberof V1TestResultSimplePostRequest
   */
  testRuns: Array<V1TestResultSimplePostRequestTestRunsInner>;
}
