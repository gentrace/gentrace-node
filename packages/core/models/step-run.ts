/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.15.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { StepRunContext } from "./step-run-context";

/**
 *
 * @export
 * @interface StepRun
 */
export interface StepRun {
  /**
   *
   * @type {string}
   * @memberof StepRun
   */
  providerName: string;
  /**
   *
   * @type {string}
   * @memberof StepRun
   */
  invocation: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRun
   */
  modelParams: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRun
   */
  inputs: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof StepRun
   */
  outputs: { [key: string]: any };
  /**
   *
   * @type {StepRunContext}
   * @memberof StepRun
   */
  context?: StepRunContext;
  /**
   *
   * @type {number}
   * @memberof StepRun
   */
  elapsedTime: number;
  /**
   *
   * @type {string}
   * @memberof StepRun
   */
  startTime: string;
  /**
   *
   * @type {string}
   * @memberof StepRun
   */
  endTime: string;
}
