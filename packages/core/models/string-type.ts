/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.23.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface StringType
 */
export interface StringType {
  /**
   *
   * @type {string}
   * @memberof StringType
   */
  type: StringTypeTypeEnum;
  /**
   *
   * @type {string}
   * @memberof StringType
   */
  value: string;
}

export const StringTypeTypeEnum = {
  String: "string",
} as const;

export type StringTypeTypeEnum =
  (typeof StringTypeTypeEnum)[keyof typeof StringTypeTypeEnum];