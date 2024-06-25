/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.26.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 *
 * @export
 * @interface PipelineV2
 */
export interface PipelineV2 {
  /**
   * The ID of the pipeline
   * @type {string}
   * @memberof PipelineV2
   */
  id: string;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof PipelineV2
   */
  createdAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof PipelineV2
   */
  updatedAt: number;
  /**
   * Timestamp in seconds since the UNIX epoch. Can be transformed into a Date object.
   * @type {number}
   * @memberof PipelineV2
   */
  archivedAt: number | null;
  /**
   * The labels attached to the pipeline
   * @type {Array<string>}
   * @memberof PipelineV2
   */
  labels: Array<string>;
  /**
   * The name of the pipeline
   * @type {string}
   * @memberof PipelineV2
   */
  displayName?: string | null;
  /**
   * The slug of the pipeline
   * @type {string}
   * @memberof PipelineV2
   */
  slug: string;
  /**
   * The ID of the organization that owns the pipeline
   * @type {string}
   * @memberof PipelineV2
   */
  organizationId: string;
  /**
   * The branch that the pipeline is associated with
   * @type {string}
   * @memberof PipelineV2
   */
  branch: string | null;
  /**
   * If null, this is a team pipeline. If not null, this is a private pipeline for the specified member ID.
   * @type {string}
   * @memberof PipelineV2
   */
  privateMemberId: string | null;
  /**
   * If null, this is a team pipeline. If not null, this is a private pipeline for the specified email.
   * @type {string}
   * @memberof PipelineV2
   */
  privateUserEmail: string | null;
}
