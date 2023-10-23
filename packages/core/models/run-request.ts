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
import { StepRun } from "./step-run";

/**
 *
 * @export
 * @interface RunRequest
 */
export interface RunRequest {
  /**
   *
   * @type {string}
   * @memberof RunRequest
   */
  id: string;
  /**
   * The method used to collect the run
   * @type {string}
   * @memberof RunRequest
   */
  collectionMethod?: RunRequestCollectionMethodEnum;
  /**
   *
   * @type {string}
   * @memberof RunRequest
   */
  slug?: string;
  /**
   *
   * @type {string}
   * @memberof RunRequest
   * @deprecated
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof RunRequest
   */
  previousRunId?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof RunRequest
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
  /**
   *
   * @type {Array<StepRun>}
   * @memberof RunRequest
   */
  stepRuns: Array<StepRun>;
}

export const RunRequestCollectionMethodEnum = {
  Manual: "manual",
  Runner: "runner",
} as const;

export type RunRequestCollectionMethodEnum =
  (typeof RunRequestCollectionMethodEnum)[keyof typeof RunRequestCollectionMethodEnum];
