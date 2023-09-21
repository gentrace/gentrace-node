/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.12.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface TestRun
 */
export interface TestRun {
  /**
   * The unique identifier for the test run.
   * @type {string}
   * @memberof TestRun
   */
  id?: string;
  /**
   * The date and time the test run was created.
   * @type {string}
   * @memberof TestRun
   */
  createdAt?: string;
  /**
   * The date and time the test run was last updated.
   * @type {string}
   * @memberof TestRun
   */
  updatedAt?: string;
  /**
   * The unique identifier for the test set associated with the test run.
   * @type {string}
   * @memberof TestRun
   */
  setId?: string;
  /**
   * The branch that the test run was created from
   * @type {string}
   * @memberof TestRun
   */
  branch?: string;
  /**
   * The commit that the test run was created from
   * @type {string}
   * @memberof TestRun
   */
  commit?: string;
  /**
   * The name of the test run
   * @type {string}
   * @memberof TestRun
   */
  name?: string;
}
