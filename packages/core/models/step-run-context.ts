/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.18.0
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
import { StepRunContextRender } from "./step-run-context-render";

/**
 *
 * @export
 * @interface StepRunContext
 */
export interface StepRunContext {
  /**
   *
   * @type {string}
   * @memberof StepRunContext
   */
  userId?: string;
  /**
   *
   * @type {StepRunContextRender}
   * @memberof StepRunContext
   */
  render?: StepRunContextRender;
  /**
   *
   * @type {{ [key: string]: MetadataValueObject; }}
   * @memberof StepRunContext
   */
  metadata?: { [key: string]: MetadataValueObject } | null;
}
