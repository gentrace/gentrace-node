/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.16.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface TestEvaluator
 */
export interface TestEvaluator {
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  createdAt: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  updatedAt: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  archivedAt?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  icon?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  name: string;
  /**
   *
   * @type {Array<any>}
   * @memberof TestEvaluator
   */
  options: Array<any> | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  aiModel?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  pipelineId: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  processorId?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  heuristicFn?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  aiPromptFormat?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  humanPrompt?: string | null;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  who: string;
  /**
   *
   * @type {string}
   * @memberof TestEvaluator
   */
  valueType: string;
}
