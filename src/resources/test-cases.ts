// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class TestCases extends APIResource {
  /**
   * Creates a new test case definition for a given dataset
   */
  create(body: TestCaseCreateParams, options?: RequestOptions): APIPromise<TestCase> {
    return this._client.post('/v4/test-cases', { body, ...options });
  }

  /**
   * Retrieves the details of a specific test case
   */
  retrieve(id: string, options?: RequestOptions): APIPromise<TestCase> {
    return this._client.get(path`/v4/test-cases/${id}`, options);
  }

  /**
   * Retrieve a list of all test cases for a given dataset
   */
  list(query: TestCaseListParams | null | undefined = {}, options?: RequestOptions): APIPromise<string> {
    return this._client.get('/v4/test-cases', { query, ...options });
  }

  /**
   * Deletes a test case by its ID (soft delete)
   */
  delete(id: string, options?: RequestOptions): APIPromise<TestCaseDeleteResponse> {
    return this._client.delete(path`/v4/test-cases/${id}`, options);
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
  inputs: Record<string, unknown> | null;

  /**
   * Test Case name
   */
  name: string;

  /**
   * Originating Run UUID
   */
  originatingRunId: string | null;

  /**
   * Associated Pipeline UUID
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
export type TestCaseList = string;

/**
 * Delete test case response
 */
export interface TestCaseDeleteResponse {
  /**
   * A boolean indicating the deletion was successful
   */
  success: boolean;
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
  pipelineSlug?: TestCaseList;
}

export declare namespace TestCases {
  export {
    type TestCase as TestCase,
    type TestCaseList as TestCaseList,
    type TestCaseDeleteResponse as TestCaseDeleteResponse,
    type TestCaseCreateParams as TestCaseCreateParams,
    type TestCaseListParams as TestCaseListParams,
  };
}
