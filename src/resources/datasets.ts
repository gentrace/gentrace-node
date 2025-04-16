// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Datasets extends APIResource {
  /**
   * Creates a new dataset definition
   */
  create(body: DatasetCreateParams, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.post('/v4/datasets', { body, ...options });
  }

  /**
   * Retrieves the details of a specific dataset
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.get(path`/v4/datasets/${id}`, options);
  }

  /**
   * Updates a dataset with the given ID
   */
  update(id: string, body: DatasetUpdateParams, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.post(path`/v4/datasets/${id}`, { body, ...options });
  }

  /**
   * Retrieve a list of all datasets
   */
  list(query: DatasetListParams | null | undefined = {}, options?: RequestOptions): APIPromise<string> {
    return this._client.get('/v4/datasets', { query, ...options });
  }
}

export interface Dataset {
  /**
   * Dataset UUID
   */
  id: string;

  /**
   * Archive timestamp (ISO 8601)
   */
  archivedAt: string | null;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Dataset description
   */
  description: string | null;

  /**
   * Dataset name
   */
  name: string;

  /**
   * Pipeline UUID
   */
  pipelineId: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

/**
 * Pipeline slug
 */
export type DatasetList = string;

export interface DatasetCreateParams {
  /**
   * The name of the dataset
   */
  name: string;

  /**
   * The description of the dataset
   */
  description?: string | null;

  /**
   * Toggle to set the dataset as the golden dataset for the pipeline
   */
  isGolden?: boolean;

  /**
   * The ID of the pipeline to create the dataset for
   */
  pipelineId?: string;

  /**
   * The slug of the pipeline to create the dataset for
   */
  pipelineSlug?: string;
}

export interface DatasetUpdateParams {
  /**
   * The description of the dataset
   */
  description?: string | null;

  /**
   * Toggles the archived status of the dataset
   */
  isArchived?: boolean;

  /**
   * Toggles whether the dataset is the golden dataset for the pipeline
   */
  isGolden?: boolean;

  /**
   * The name of the dataset
   */
  name?: string;
}

export interface DatasetListParams {
  /**
   * Flag to include archived datasets
   */
  archived?: boolean;

  /**
   * Filter to the datasets for a specific pipeline by UUID
   */
  pipelineId?: string;

  /**
   * Pipeline slug
   */
  pipelineSlug?: DatasetList;
}

export declare namespace Datasets {
  export {
    type Dataset as Dataset,
    type DatasetList as DatasetList,
    type DatasetCreateParams as DatasetCreateParams,
    type DatasetUpdateParams as DatasetUpdateParams,
    type DatasetListParams as DatasetListParams,
  };
}
