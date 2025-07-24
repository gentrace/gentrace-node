// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Experiments extends APIResource {
  /**
   * Create a new experiment
   *
   * @example
   * ```ts
   * const experiment = await client.experiments.create({
   *   pipelineId: '123e4567-e89b-12d3-a456-426614174000',
   * });
   * ```
   */
  create(body: ExperimentCreateParams, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.post('/v4/experiments', { body, ...options });
  }

  /**
   * Retrieve the details of a experiment by ID
   *
   * @example
   * ```ts
   * const experiment = await client.experiments.retrieve(
   *   '123e4567-e89b-12d3-a456-426614174000',
   * );
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.get(path`/v4/experiments/${id}`, options);
  }

  /**
   * Update the details of a experiment by ID
   *
   * @example
   * ```ts
   * const experiment = await client.experiments.update(
   *   '123e4567-e89b-12d3-a456-426614174000',
   * );
   * ```
   */
  update(id: string, body: ExperimentUpdateParams, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.post(path`/v4/experiments/${id}`, { body, ...options });
  }

  /**
   * List experiments
   *
   * @example
   * ```ts
   * const experimentList = await client.experiments.list();
   * ```
   */
  list(
    query: ExperimentListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ExperimentList> {
    return this._client.get('/v4/experiments', { query, ...options });
  }
}

export interface Experiment {
  /**
   * Experiment UUID
   */
  id: string;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Metadata
   */
  metadata: { [key: string]: unknown } | null;

  /**
   * Friendly experiment name
   */
  name: string | null;

  /**
   * Pipeline UUID
   */
  pipelineId: string;

  /**
   * Resource path to navigate to the experiment
   */
  resourcePath: string | null;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

export interface ExperimentList {
  data: Array<Experiment>;
}

export interface ExperimentCreateParams {
  /**
   * The ID of the pipeline to create the experiment for, or "default" to use the
   * organization's default pipeline
   */
  pipelineId: string;

  /**
   * Optional metadata for the experiment
   */
  metadata?: { [key: string]: unknown };

  /**
   * Friendly experiment name
   */
  name?: string;
}

export interface ExperimentUpdateParams {
  /**
   * Metadata
   */
  metadata?: { [key: string]: unknown } | null;

  /**
   * Friendly experiment name
   */
  name?: string | null;

  /**
   * Status
   */
  status?: 'GENERATING' | 'EVALUATING';
}

export interface ExperimentListParams {
  /**
   * Filter to the datasets for a specific pipeline by UUID
   */
  pipelineId?: string;
}

export declare namespace Experiments {
  export {
    type Experiment as Experiment,
    type ExperimentList as ExperimentList,
    type ExperimentCreateParams as ExperimentCreateParams,
    type ExperimentUpdateParams as ExperimentUpdateParams,
    type ExperimentListParams as ExperimentListParams,
  };
}
