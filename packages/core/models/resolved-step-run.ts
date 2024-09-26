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
 * @interface ResolvedStepRun
 */
export interface ResolvedStepRun {
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  id?: string;
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  organizationId?: string;
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  providerName?: string;
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  invocation?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ResolvedStepRun
   */
  modelParams?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ResolvedStepRun
   */
  inputs?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ResolvedStepRun
   */
  outputs?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  startTime?: string;
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  endTime?: string;
  /**
   *
   * @type {string}
   * @memberof ResolvedStepRun
   */
  pipelineRunId?: string;
}
