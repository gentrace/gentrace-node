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
import { LocalEvaluationDebugError } from "./local-evaluation-debug-error";

/**
 *
 * @export
 * @interface LocalEvaluationDebug
 */
export interface LocalEvaluationDebug {
  /**
   * The resolved prompt used for the evaluation
   * @type {string}
   * @memberof LocalEvaluationDebug
   */
  resolvedPrompt?: string;
  /**
   * The response received from the evaluation
   * @type {string}
   * @memberof LocalEvaluationDebug
   */
  response?: string;
  /**
   * The final classification of the evaluation
   * @type {string}
   * @memberof LocalEvaluationDebug
   */
  finalClassification?: string;
  /**
   * Processor logs
   * @type {Array<Array<any>>}
   * @memberof LocalEvaluationDebug
   */
  processorLogs?: Array<Array<any>>;
  /**
   * Evaluator logs
   * @type {Array<Array<any>>}
   * @memberof LocalEvaluationDebug
   */
  logs?: Array<Array<any>>;
  /**
   *
   * @type {LocalEvaluationDebugError}
   * @memberof LocalEvaluationDebug
   */
  error?: LocalEvaluationDebugError;
}
