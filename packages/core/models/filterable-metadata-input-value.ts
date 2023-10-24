/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.22.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { FilterableMetadataInputValueEquals } from "./filterable-metadata-input-value-equals";
// May contain unused imports in some cases
// @ts-ignore
import { FilterableMetadataInputValueGt } from "./filterable-metadata-input-value-gt";
// May contain unused imports in some cases
// @ts-ignore
import { FilterableMetadataInputValueGte } from "./filterable-metadata-input-value-gte";
// May contain unused imports in some cases
// @ts-ignore
import { FilterableMetadataInputValueLt } from "./filterable-metadata-input-value-lt";
// May contain unused imports in some cases
// @ts-ignore
import { FilterableMetadataInputValueLte } from "./filterable-metadata-input-value-lte";

/**
 *
 * @export
 * @interface FilterableMetadataInputValue
 */
export interface FilterableMetadataInputValue {
  /**
   * Specifies if the metadata key exists.
   * @type {boolean}
   * @memberof FilterableMetadataInputValue
   */
  exists?: boolean;
  /**
   * The metadata value contains this string.
   * @type {string}
   * @memberof FilterableMetadataInputValue
   */
  contains?: string;
  /**
   *
   * @type {FilterableMetadataInputValueEquals}
   * @memberof FilterableMetadataInputValue
   */
  equals?: FilterableMetadataInputValueEquals;
  /**
   *
   * @type {FilterableMetadataInputValueGt}
   * @memberof FilterableMetadataInputValue
   */
  gt?: FilterableMetadataInputValueGt;
  /**
   *
   * @type {FilterableMetadataInputValueGte}
   * @memberof FilterableMetadataInputValue
   */
  gte?: FilterableMetadataInputValueGte;
  /**
   *
   * @type {FilterableMetadataInputValueLt}
   * @memberof FilterableMetadataInputValue
   */
  lt?: FilterableMetadataInputValueLt;
  /**
   *
   * @type {FilterableMetadataInputValueLte}
   * @memberof FilterableMetadataInputValue
   */
  lte?: FilterableMetadataInputValueLte;
}