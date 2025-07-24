// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Organizations extends APIResource {
  /**
   * Retrieve the details of a organization by ID
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<Organization> {
    return this._client.get(path`/v4/organizations/${id}`, options);
  }
}

export interface Organization {
  /**
   * Organization UUID
   */
  id: string;

  /**
   * Creation timestamp (ISO 8601)
   */
  createdAt: string;

  /**
   * Default pipeline ID for the organization
   */
  defaultPipelineId: string | null;

  /**
   * Organization name
   */
  name: string;

  /**
   * Organization slug
   */
  slug: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

export declare namespace Organizations {
  export { type Organization as Organization };
}
