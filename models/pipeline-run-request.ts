/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace Ingestion API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.0.12
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { PipelineRunRequestStepRunsInner } from './pipeline-run-request-step-runs-inner';

/**
 * 
 * @export
 * @interface PipelineRunRequest
 */
export interface PipelineRunRequest {
    /**
     * 
     * @type {string}
     * @memberof PipelineRunRequest
     */
    'name': string;
    /**
     * 
     * @type {Array<PipelineRunRequestStepRunsInner>}
     * @memberof PipelineRunRequest
     */
    'stepRuns': Array<PipelineRunRequestStepRunsInner>;
}

