// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Datasets extends APIResource {
  /**
   * Create a new dataset
   */
  create(body: DatasetCreateParams, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.post('/v4/datasets', { body, ...options });
  }

  /**
   * Retrieve the details of a dataset by ID
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.get(path`/v4/datasets/${id}`, options);
  }

  /**
   * Update the details of a dataset by ID
   */
  update(id: string, body: DatasetUpdateParams, options?: RequestOptions): APIPromise<Dataset> {
    return this._client.post(path`/v4/datasets/${id}`, { body, ...options });
  }

  /**
   * List datasets
   */
  list(query: DatasetListParams | null | undefined = {}, options?: RequestOptions): APIPromise<DatasetList> {
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

export interface DatasetList {
  data: Array<Dataset>;
}

export interface DatasetCreateParams {
  /**
   * Dataset description
   */
  description: string | null;

  /**
   * Dataset name
   */
  name: string;

  /**
   * Whether the dataset is golden
   */
  isGolden?: boolean;

  /**
   * Pipeline ID (mutually exclusive with pipelineSlug)
   */
  pipelineId?: string;

  /**
   * Pipeline slug (mutually exclusive with pipelineId)
   */
  pipelineSlug?: string;
}

export interface DatasetUpdateParams {
  /**
   * Dataset description
   */
  description?: string | null;

  /**
   * Archive the dataset
   */
  isArchived?: boolean;

  /**
   * Set the dataset as the golden dataset
   */
  isGolden?: boolean;

  /**
   * Dataset name
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
  pipelineSlug?: string;
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
