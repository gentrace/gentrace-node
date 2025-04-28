// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { buildHeaders } from '../internal/headers';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class TestCases extends APIResource {
  /**
   * Create a new test case
   */
  create(body: TestCaseCreateParams, options?: RequestOptions): APIPromise<TestCase> {
    return this._client.post('/v4/test-cases', { body, ...options });
  }

  /**
   * Retrieve the details of a test case by ID
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<TestCase> {
    return this._client.get(path`/v4/test-cases/${id}`, options);
  }

  /**
   * List test cases
   */
  list(
    query: TestCaseListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<TestCaseList> {
    return this._client.get('/v4/test-cases', { query, ...options });
  }

  /**
   * Delete a test case by ID
   */
  delete(id: string, options?: RequestOptions): APIPromise<void> {
    return this._client.delete(path`/v4/test-cases/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }
}

export interface TestCase {
  /**
   * Test Case UUID
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
   * Associated Dataset UUID
   */
  datasetId: string;

  /**
   * Deletion timestamp (ISO 8601)
   */
  deletedAt: string | null;

  /**
   * Expected output data for the test case
   */
  expectedOutputs: Record<string, unknown> | null;

  /**
   * Input data for the test case
   */
  inputs: Record<string, unknown>;

  /**
   * Test Case name
   */
  name: string;

  /**
   * Associated Pipeline UUID
   */
  pipelineId: string;

  /**
   * Last update timestamp (ISO 8601)
   */
  updatedAt: string;
}

export interface TestCaseList {
  data: Array<TestCase>;
}

export interface TestCaseCreateParams {
  /**
   * Dataset UUID
   */
  datasetId: string;

  /**
   * Test case inputs as a JSON object
   */
  inputs: Record<string, unknown>;

  /**
   * Test case name
   */
  name: string;

  /**
   * Optional expected outputs as a JSON object
   */
  expectedOutputs?: Record<string, unknown>;
}

export interface TestCaseListParams {
  /**
   * Dataset ID
   */
  datasetId?: string;

  /**
   * Filter to the datasets for a specific pipeline by UUID
   */
  pipelineId?: string;

  /**
   * Pipeline slug
   */
  pipelineSlug?: string;
}

export declare namespace TestCases {
  export {
    type TestCase as TestCase,
    type TestCaseList as TestCaseList,
    type TestCaseCreateParams as TestCaseCreateParams,
    type TestCaseListParams as TestCaseListParams,
  };
}
