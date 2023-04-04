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
import { PipelineRunRequestStepRunsInnerProviderModelParamsValue } from './pipeline-run-request-step-runs-inner-provider-model-params-value';

/**
 * 
 * @export
 * @interface PipelineRunRequestStepRunsInnerProvider
 */
export interface PipelineRunRequestStepRunsInnerProvider {
    /**
     * 
     * @type {string}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'name'?: string;
    /**
     * 
     * @type {string}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'invocation'?: string;
    /**
     * 
     * @type {{ [key: string]: PipelineRunRequestStepRunsInnerProviderModelParamsValue; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'modelParams'?: { [key: string]: PipelineRunRequestStepRunsInnerProviderModelParamsValue; };
    /**
     * 
     * @type {{ [key: string]: PipelineRunRequestStepRunsInnerProviderModelParamsValue; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'inputs'?: { [key: string]: PipelineRunRequestStepRunsInnerProviderModelParamsValue; };
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'outputs'?: { [key: string]: any; };
}

