/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: ${npm_package_version}
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { PipelineRunRequestStepRunsInnerProvider } from './pipeline-run-request-step-runs-inner-provider';

/**
 * 
 * @export
 * @interface PipelineRunRequestStepRunsInner
 */
export interface PipelineRunRequestStepRunsInner {
    /**
     * 
     * @type {PipelineRunRequestStepRunsInnerProvider}
     * @memberof PipelineRunRequestStepRunsInner
     */
    'provider'?: PipelineRunRequestStepRunsInnerProvider;
    /**
     * 
     * @type {number}
     * @memberof PipelineRunRequestStepRunsInner
     */
    'elapsedTime'?: number;
    /**
     * 
     * @type {string}
     * @memberof PipelineRunRequestStepRunsInner
     */
    'startTime'?: string;
    /**
     * 
     * @type {string}
     * @memberof PipelineRunRequestStepRunsInner
     */
    'endTime'?: string;
}

