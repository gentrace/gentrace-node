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
import { MetadataValueObject } from "./metadata-value-object";
// May contain unused imports in some cases
// @ts-ignore
import { V1TestResultPostRequestTestRunsInner } from "./v1-test-result-post-request-test-runs-inner";

/**
 *
 * @export
 * @interface V1TestResultPostRequest
 */
export interface V1TestResultPostRequest {
  /**
   * The pipeline slug to create the test result for. Only one of pipelineSlug or pipelineId is required.
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  pipelineSlug?: string;
  /**
   * The pipeline ID to create the test result for. Only one of pipelineSlug or pipelineId is required.
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  pipelineId?: string;
  /**
   * The method used to collect the test runs
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  collectionMethod?: V1TestResultPostRequestCollectionMethodEnum;
  /**
   * The branch that the test result was created from
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  branch?: string | null;
  /**
   * The commit that the test result was created from
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  commit?: string | null;
  /**
   * The name of the test result
   * @type {string}
   * @memberof V1TestResultPostRequest
   */
  name?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof V1TestResultPostRequest
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   *
   * @type {Array<V1TestResultPostRequestTestRunsInner>}
   * @memberof V1TestResultPostRequest
   */
  testRuns: Array<V1TestResultPostRequestTestRunsInner>;
}

export const V1TestResultPostRequestCollectionMethodEnum = {
  Manual: "manual",
  Runner: "runner",
} as const;

export type V1TestResultPostRequestCollectionMethodEnum =
  (typeof V1TestResultPostRequestCollectionMethodEnum)[keyof typeof V1TestResultPostRequestCollectionMethodEnum];