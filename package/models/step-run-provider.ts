/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.11.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface StepRunProvider
 */
export interface StepRunProvider {
  /**
   *
   * @type {string}
   * @memberof StepRunProvider
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof StepRunProvider
   */
  invocation?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRunProvider
   */
  modelParams?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRunProvider
   */
  inputs?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRunProvider
   */
  outputs?: { [key: string]: any };
}
