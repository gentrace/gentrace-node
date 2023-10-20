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

/**
 *
 * @export
 * @interface TestEvaluation
 */
export interface TestEvaluation {
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  createdAt: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  updatedAt: string;
  /**
   *
   * @type {boolean}
   * @memberof TestEvaluation
   */
  isPending: boolean;
  /**
   *
   * @type {object}
   * @memberof TestEvaluation
   */
  debug?: object | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  evaluatorId: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  runId: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  evalLabel?: string | null;
  /**
   *
   * @type {number}
   * @memberof TestEvaluation
   */
  evalValue?: number | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluation
   */
  manualCreatedByEmail?: string | null;
  /**
   *
   * @type {number}
   * @memberof TestEvaluation
   */
  billingGpt4InputTokens: number;
  /**
   *
   * @type {number}
   * @memberof TestEvaluation
   */
  billingGpt4OutputTokens: number;
  /**
   *
   * @type {number}
   * @memberof TestEvaluation
   */
  billingGpt35InputTokens: number;
  /**
   *
   * @type {number}
   * @memberof TestEvaluation
   */
  billingGpt35OutputTokens: number;
}
