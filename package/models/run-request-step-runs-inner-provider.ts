/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.9.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface RunRequestStepRunsInnerProvider
 */
export interface RunRequestStepRunsInnerProvider {
  /**
   *
   * @type {string}
   * @memberof RunRequestStepRunsInnerProvider
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof RunRequestStepRunsInnerProvider
   */
  invocation?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof RunRequestStepRunsInnerProvider
   */
  modelParams?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof RunRequestStepRunsInnerProvider
   */
  inputs?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof RunRequestStepRunsInnerProvider
   */
  outputs?: { [key: string]: any };
}
