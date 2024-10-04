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

/**
 *
 * @export
 * @interface EvaluationV3
 */
export interface EvaluationV3 {
  /**
   * The ID of the evaluation
   * @type {string}
   * @memberof EvaluationV3
   */
  id: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof EvaluationV3
   */
  createdAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof EvaluationV3
   */
  updatedAt: number;
  /**
   * Indicates if the evaluation is pending
   * @type {boolean}
   * @memberof EvaluationV3
   */
  isPending: boolean;
  /**
   * Indicates if the evaluation is filtered
   * @type {boolean}
   * @memberof EvaluationV3
   */
  isFiltered: boolean;
  /**
   * Debug information for the evaluation
   * @type {{ [key: string]: any; }}
   * @memberof EvaluationV3
   */
  debug?: { [key: string]: any } | null;
  /**
   * The ID of the evaluator
   * @type {string}
   * @memberof EvaluationV3
   */
  evaluatorId: string | null;
  /**
   * The ID of the run
   * @type {string}
   * @memberof EvaluationV3
   */
  runId: string;
  /**
   * The ID of the comparison run, if applicable
   * @type {string}
   * @memberof EvaluationV3
   */
  comparisonRunId?: string | null;
  /**
   * The name of the evaluation
   * @type {string}
   * @memberof EvaluationV3
   */
  name: string | null;
  /**
   * The label of the evaluation
   * @type {string}
   * @memberof EvaluationV3
   */
  evalLabel: string | null;
  /**
   * The value of the evaluation
   * @type {number}
   * @memberof EvaluationV3
   */
  evalValue: number | null;
  /**
   * The email of the user who manually created the evaluation, if applicable
   * @type {string}
   * @memberof EvaluationV3
   */
  manualCreatedByEmail?: string | null;
  /**
   * Additional notes for the evaluation
   * @type {string}
   * @memberof EvaluationV3
   */
  note: string;
}
