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
 * @interface SearchableStringInputAnyOf
 */
export interface SearchableStringInputAnyOf {
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputAnyOf
   */
  contains?: string;
  /**
   * For Postgres full text search
   * @type {string}
   * @memberof SearchableStringInputAnyOf
   */
  search?: string;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputAnyOf
   */
  startsWith?: string;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputAnyOf
   */
  endsWith?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof SearchableStringInputAnyOf
   */
  in?: Array<string>;
  /**
   *
   * @type {Array<string>}
   * @memberof SearchableStringInputAnyOf
   */
  notIn?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof SearchableStringInputAnyOf
   */
  mode?: SearchableStringInputAnyOfModeEnum;
}

export const SearchableStringInputAnyOfModeEnum = {
  Insensitive: "insensitive",
  Default: "default",
} as const;

export type SearchableStringInputAnyOfModeEnum =
  (typeof SearchableStringInputAnyOfModeEnum)[keyof typeof SearchableStringInputAnyOfModeEnum];
