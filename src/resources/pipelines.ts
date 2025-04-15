// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Pipelines extends APIResource {
  /**
   * Creates a new pipeline definition
   */
  create(body: PipelineCreateParams, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.post('/v4/pipelines', { body, ...options });
  }

  /**
   * Retrieves the details of a specific pipeline
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.get(path`/v4/pipelines/${id}`, options);
  }

  /**
   * Updates a pipeline with the given ID
   */
  update(id: string, body: PipelineUpdateParams, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.post(path`/v4/pipelines/${id}`, { body, ...options });
  }

  /**
   * Retrieve a list of all pipelines
   */
  list(
    query: PipelineListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<PipelineListResponse> {
    return this._client.get('/v4/pipelines', { query, ...options });
  }
}

export interface Pipeline {
  /**
   * Pipeline UUID
   */
  id: string;

  /**
   * Archive timestamp (ISO 8601)
   */
  archivedAt: string | null;

  /**
   * Branch name
   */
  branch: string | null;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Pipeline display name
   */
  displayName: string | null;

  /**
   * Folder UUID
   */
  folderId: string | null;

  /**
   * Golden dataset UUID
   */
  goldenDatasetId: string | null;

  /**
   * Labels
   */
  labels: Array<string>;

  /**
   * Organization UUID
   */
  organizationId: string;

  /**
   * Private member UUID
   */
  privateMemberId: string | null;

  /**
   * @deprecated Saved result display configuration
   */
  savedResultDisplay: Record<string, unknown> | null;

  /**
   * @deprecated Saved runs display configuration
   */
  savedRunsDisplay: Record<string, unknown> | null;

  /**
   * Pipeline slug
   */
  slug: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;

  /**
   * Pipeline version (version 2 and beyond have tracing support)
   */
  version: number;
}

export interface PipelineListResponse {
  data: Array<Pipeline>;
}

export interface PipelineCreateParams {
  /**
   * A URL-friendly identifier (lowercase alphanumeric with dashes)
   */
  slug: string;

  /**
   * The branch of the pipeline
   */
  branch?: string | null;

  /**
   * The display name of the pipeline
   */
  displayName?: string | null;

  /**
   * The ID of the folder containing the pipeline. If not provided, the pipeline will
   * be created at root level
   */
  folderId?: string | null;

  /**
   * Whether the pipeline is private
   */
  isPrivate?: boolean | null;

  /**
   * Labels for the pipeline
   */
  labels?: Array<string>;

  /**
   * The version of the pipeline
   */
  version?: 1 | 2;
}

export interface PipelineUpdateParams {
  /**
   * The branch of the pipeline
   */
  branch?: string | null;

  /**
   * The display name of the pipeline
   */
  displayName?: string | null;

  /**
   * The ID of the folder containing the pipeline. If not provided, the pipeline will
   * be created at root level
   */
  folderId?: string | null;

  /**
   * Whether the pipeline is archived
   */
  isArchived?: boolean;

  /**
   * Labels for the pipeline
   */
  labels?: Array<string>;

  /**
   * Saved runs display configuration
   */
  savedRunsDisplay?: PipelineUpdateParams.SavedRunsDisplay | null;
}

export namespace PipelineUpdateParams {
  /**
   * @deprecated Saved runs display configuration
   */
  export interface SavedRunsDisplay {
    evaluators?: SavedRunsDisplay.Evaluators;

    feedback?: SavedRunsDisplay.Feedback;

    inputs?: SavedRunsDisplay.Inputs;

    metadata?: SavedRunsDisplay.Metadata;

    outputs?: SavedRunsDisplay.Outputs;

    size?: 'compact' | 'medium' | 'large' | 'full';
  }

  export namespace SavedRunsDisplay {
    export interface Evaluators {
      hide?: Array<string>;
    }

    export interface Feedback {
      show?: boolean;
    }

    export interface Inputs {
      as?: 'tabular' | 'json';

      hide?: Array<string>;

      pretty?: boolean;

      showCompact?: Array<string>;
    }

    export interface Metadata {
      as?: 'tabular' | 'json';

      show?: Array<string>;
    }

    export interface Outputs {
      as?: 'tabular' | 'json';

      hide?: Array<string>;

      pretty?: boolean;
    }
  }
}

export interface PipelineListParams {
  /**
   * The ID of the folder to filter pipelines by
   */
  folderId?: string | null;

  /**
   * Filter pipelines by label
   */
  label?: string;

  /**
   * Filter pipelines by slug
   */
  slug?: string | PipelineListParams.UnionMember1;
}

export namespace PipelineListParams {
  export interface UnionMember1 {
    contains?: string;

    endsWith?: string;

    in?: Array<string>;

    mode?: 'insensitive' | 'default';

    notIn?: Array<string>;

    search?: string;

    startsWith?: string;
  }
}

export declare namespace Pipelines {
  export {
    type Pipeline as Pipeline,
    type PipelineListResponse as PipelineListResponse,
    type PipelineCreateParams as PipelineCreateParams,
    type PipelineUpdateParams as PipelineUpdateParams,
    type PipelineListParams as PipelineListParams,
  };
}
