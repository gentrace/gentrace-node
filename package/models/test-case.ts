/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.7.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface TestCase
 */
export interface TestCase {
    /**
     * The ID of the test case
     * @type {string}
     * @memberof TestCase
     */
    'id': string;
    /**
     * The date and time when the test case was created
     * @type {string}
     * @memberof TestCase
     */
    'createdAt': string;
    /**
     * The date and time when the test case was archived, can be null if the test case has not been archived
     * @type {string}
     * @memberof TestCase
     */
    'archivedAt'?: string | null;
    /**
     * The date and time when the test case was last updated
     * @type {string}
     * @memberof TestCase
     */
    'updatedAt': string;
    /**
     * The expected output for the test case
     * @type {string}
     * @memberof TestCase
     */
    'expected'?: string | null;
    /**
     * The input data for the test case as a JSON object
     * @type {object}
     * @memberof TestCase
     */
    'inputs': object;
    /**
     * The name of the test case
     * @type {string}
     * @memberof TestCase
     */
    'name': string;
    /**
     * The ID of the test set that the test case belongs to
     * @type {string}
     * @memberof TestCase
     */
    'setId': string;
}

