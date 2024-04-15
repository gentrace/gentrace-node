/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.24.3
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface CreateFeedbackV2
 */
export interface CreateFeedbackV2 {
  /**
   * The unique identifier for the pipeline run
   * @type {string}
   * @memberof CreateFeedbackV2
   */
  pipelineRunId: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof CreateFeedbackV2
   */
  recordedTime: number;
  /**
   * The score of the feedback, ranging from 0 to 1
   * @type {number}
   * @memberof CreateFeedbackV2
   */
  score: number;
  /**
   * Optional details about the feedback
   * @type {string}
   * @memberof CreateFeedbackV2
   */
  details?: string | null;
}
