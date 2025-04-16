// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Experiments extends APIResource {
  /**
   * Creates a new experiment definition
   */
  create(body: ExperimentCreateParams, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.post('/v4/experiments', { body, ...options });
  }

  /**
   * Retrieves the details of a specific experiment
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.get(path`/v4/experiments/${id}`, options);
  }

  /**
   * Updates an experiment with the given ID
   */
  update(id: string, body: ExperimentUpdateParams, options?: RequestOptions): APIPromise<Experiment> {
    return this._client.post(path`/v4/experiments/${id}`, { body, ...options });
  }

  /**
   * Retrieve a list of all experiments
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
   * Git branch
   */
  branch: string | null;

  /**
   * Git commit hash
   */
  commit: string | null;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Metadata
   */
  metadata: Record<string, unknown> | null;

  /**
   * Friendly experiment name
   */
  name: string | null;

  /**
   * Pipeline UUID
   */
  pipelineId: string;

  /**
   * Status
   */
  status: 'GENERATING' | 'EVALUATING';

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
   * The ID of the pipeline to create the experiment for
   */
  pipelineId: string;

  /**
   * Git branch
   */
  branch?: string;

  /**
   * Git commit hash
   */
  commit?: string;

  /**
   * Optional metadata for the experiment
   */
  metadata?: Record<string, unknown>;

  /**
   * Friendly experiment name
   */
  name?: string;
}

export interface ExperimentUpdateParams {
  /**
   * Updated metadata for the experiment
   */
  metadata?: Record<string, unknown>;

  /**
   * Updated name for the experiment
   */
  name?: string;

  /**
   * Updated status of the experiment
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
