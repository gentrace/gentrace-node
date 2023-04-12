/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.4.0
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
     * @type {string}
     * @memberof FeedbackRequest
     */
    'rating': FeedbackRequestRatingEnum;
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

export const FeedbackRequestRatingEnum = {
    Positive: 'positive',
    Negative: 'negative',
    Neutral: 'neutral'
} as const;

export type FeedbackRequestRatingEnum = typeof FeedbackRequestRatingEnum[keyof typeof FeedbackRequestRatingEnum];


