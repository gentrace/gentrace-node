/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.11.2
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface FeedbackRequest
 */
export interface FeedbackRequest {
    /**
     * 
     * @type {string}
     * @memberof FeedbackRequest
     */
    'pipelineRunId': string;
    /**
     * 
     * @type {number}
     * @memberof FeedbackRequest
     */
    'score': number;
    /**
     * 
     * @type {string}
     * @memberof FeedbackRequest
     */
    'recordedTime': string;
    /**
     * 
     * @type {string}
     * @memberof FeedbackRequest
     */
    'details'?: string | null;
}

