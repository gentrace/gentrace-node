/* tslint:disable */
/* eslint-disable */
/**
 * Gentrace API
 * These API routes are designed to ingest events from clients.
 *
 * The version of the OpenAPI document: 0.6.3
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



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
     * @type {{ [key: string]: any; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'modelParams'?: { [key: string]: any; };
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'inputs'?: { [key: string]: any; };
    /**
     * 
     * @type {{ [key: string]: any; }}
     * @memberof PipelineRunRequestStepRunsInnerProvider
     */
    'outputs'?: { [key: string]: any; };
}

