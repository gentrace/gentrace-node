/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.14.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import { CreateMultipleTestCases } from "./create-multiple-test-cases";
// May contain unused imports in some cases
// @ts-ignore
import { CreateMultipleTestCasesTestCasesInner } from "./create-multiple-test-cases-test-cases-inner";
// May contain unused imports in some cases
// @ts-ignore
import { CreateSingleTestCase } from "./create-single-test-case";

/**
 * @type TestCasePostRequest
 * @export
 */
export type TestCasePostRequest =
  | CreateMultipleTestCases
  | CreateSingleTestCase;
