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

/**
 *
 * @export
 * @interface FullRun
 */
export interface FullRun {
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  pipelineRunId: string;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  pipelineId: string;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  organizationId: string;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  startTime: string;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  endTime: string;
  /**
   *
   * @type {number}
   * @memberof FullRun
   */
  cost?: number | null;
  /**
   *
   * @type {number}
   * @memberof FullRun
   */
  elapsed?: number | null;
  /**
   *
   * @type {number}
   * @memberof FullRun
   */
  feedback?: number | null;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  lastInvocation?: string | null;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof FullRun
   */
  inputs?: { [key: string]: any } | null;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof FullRun
   */
  outputs?: { [key: string]: any } | null;
  /**
   *
   * @type {string}
   * @memberof FullRun
   */
  renderHTMLKey?: string | null;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof FullRun
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
}
