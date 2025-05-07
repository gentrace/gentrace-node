// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Pipelines extends APIResource {
  /**
   * Create a new pipeline
   *
   * @example
   * ```ts
   * const pipeline = await client.pipelines.create({
   *   slug: 'my-awesome-pipeline',
   * });
   * ```
   */
  create(body: PipelineCreateParams, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.post('/v4/pipelines', { body, ...options });
  }

  /**
   * Retrieve the details of a pipeline by ID
   *
   * @example
   * ```ts
   * const pipeline = await client.pipelines.retrieve(
   *   '123e4567-e89b-12d3-a456-426614174000',
   * );
   * ```
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.get(path`/v4/pipelines/${id}`, options);
  }

  /**
   * Update the details of a pipeline by ID
   *
   * @example
   * ```ts
   * const pipeline = await client.pipelines.update(
   *   '123e4567-e89b-12d3-a456-426614174000',
   * );
   * ```
   */
  update(id: string, body: PipelineUpdateParams, options?: RequestOptions): APIPromise<Pipeline> {
    return this._client.post(path`/v4/pipelines/${id}`, { body, ...options });
  }

  /**
   * List pipelines
   *
   * @example
   * ```ts
   * const pipelineList = await client.pipelines.list();
   * ```
   */
  list(
    query: PipelineListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<PipelineList> {
    return this._client.get('/v4/pipelines', { query, ...options });
  }
}

export interface CreatePipelineBody {
  /**
   * Pipeline slug
   */
  slug: string;

  /**
   * Pipeline display name
   */
  displayName?: string | null;

  /**
   * Folder UUID
   */
  folderId?: string | null;
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
   * Pipeline slug
   */
  slug: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

export interface PipelineList {
  data: Array<Pipeline>;
}

export interface PipelineCreateParams {
  /**
   * Pipeline slug
   */
  slug: string;

  /**
   * Pipeline display name
   */
  displayName?: string | null;

  /**
   * Folder UUID
   */
  folderId?: string | null;
}

export interface PipelineUpdateParams {
  /**
   * Pipeline display name
   */
  displayName?: string | null;

  /**
   * Folder UUID
   */
  folderId?: string | null;

  /**
   * Whether the pipeline is archived
   */
  isArchived?: boolean;
}

export interface PipelineListParams {
  /**
   * The ID of the folder to filter pipelines by
   */
  folderId?: string | null;

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
    type CreatePipelineBody as CreatePipelineBody,
    type Pipeline as Pipeline,
    type PipelineList as PipelineList,
    type PipelineCreateParams as PipelineCreateParams,
    type PipelineUpdateParams as PipelineUpdateParams,
    type PipelineListParams as PipelineListParams,
  };
}
