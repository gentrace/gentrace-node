/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.24.2
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface SearchableStringInputOneOf
 */
export interface SearchableStringInputOneOf {
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputOneOf
   */
  contains?: string;
  /**
   * For Postgres full text search
   * @type {string}
   * @memberof SearchableStringInputOneOf
   */
  search?: string;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputOneOf
   */
  startsWith?: string;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputOneOf
   */
  endsWith?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof SearchableStringInputOneOf
   */
  in?: Array<string>;
  /**
   *
   * @type {Array<string>}
   * @memberof SearchableStringInputOneOf
   */
  notIn?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputOneOf
   */
  mode?: SearchableStringInputOneOfModeEnum;
}

export const SearchableStringInputOneOfModeEnum = {
  Insensitive: "insensitive",
  Default: "default",
} as const;

export type SearchableStringInputOneOfModeEnum =
  (typeof SearchableStringInputOneOfModeEnum)[keyof typeof SearchableStringInputOneOfModeEnum];
