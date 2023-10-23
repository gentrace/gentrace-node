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
 * @interface SearchableUnixSecondsInputAnyOf
 */
export interface SearchableUnixSecondsInputAnyOf {
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof SearchableUnixSecondsInputAnyOf
   */
  gt?: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof SearchableUnixSecondsInputAnyOf
   */
  gte?: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof SearchableUnixSecondsInputAnyOf
   */
  lt?: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof SearchableUnixSecondsInputAnyOf
   */
  lte?: number;
}
