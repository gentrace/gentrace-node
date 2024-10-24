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
import { LocalEvaluationDebug } from "./local-evaluation-debug";

/**
 *
 * @export
 * @interface LocalEvaluation
 */
export interface LocalEvaluation {
  /**
   * The name of the local evaluation
   * @type {string}
   * @memberof LocalEvaluation
   */
  name: string;
  /**
   * The numeric value of the evaluation
   * @type {number}
   * @memberof LocalEvaluation
   */
  value: number;
  /**
   * Optional label for the evaluation
   * @type {string}
   * @memberof LocalEvaluation
   */
  label?: string | null;
  /**
   *
   * @type {LocalEvaluationDebug}
   * @memberof LocalEvaluation
   */
  debug?: LocalEvaluationDebug;
}
