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
import { CreateEvaluationV2 } from "./create-evaluation-v2";

/**
 *
 * @export
 * @interface V2EvaluationsBulkPostRequest
 */
export interface V2EvaluationsBulkPostRequest {
  /**
   *
   * @type {Array<CreateEvaluationV2>}
   * @memberof V2EvaluationsBulkPostRequest
   */
  data: Array<CreateEvaluationV2>;
}
