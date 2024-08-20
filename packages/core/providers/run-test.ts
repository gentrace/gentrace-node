import { TestCase, V1TestResultPost200Response } from "../models";
import { ResultContext } from "./context";
import { PipelineRun } from "./pipeline-run";
import {
  constructStepRuns,
  decrementTestCounter,
  getContextTestCaseFilter,
  incrementTestCounter,
} from "./utils";
import { globalGentraceApi } from "./init";
import { getTestCases, getTestCasesForDataset } from "./test-case";
import { constructSubmissionPayloadAdvanced, TestRun } from "./test-result";
import { getPipelines } from "./pipeline-methods";

async function runTestCore(
  pipelineSlug: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  context?: ResultContext,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
  datasetId?: string,
): Promise<V1TestResultPost200Response> {
  incrementTestCounter();

  try {
    const allPipelines = await getPipelines();
    const matchingPipeline = allPipelines.find(
      (pipeline) => pipeline.slug === pipelineSlug,
    );

    if (!matchingPipeline) {
      throw new Error(
        `Could not find the specified pipeline (${pipelineSlug})`,
      );
    }
    const testCases = datasetId
      ? await getTestCasesForDataset(datasetId)
      : await getTestCases(pipelineSlug);

    const testRuns: TestRun[] = [];

    for (const testCase of testCases) {
      if (caseFilter && !caseFilter(testCase)) {
        continue;
      }

      const [, pipelineRun] = await handler(testCase);
      const testRun = constructStepRuns(testCase, pipelineRun);
      testRuns.push(testRun);
    }

    if (!globalGentraceApi) {
      throw new Error("Gentrace API key not initialized. Call init() first.");
    }

    const body = constructSubmissionPayloadAdvanced(
      matchingPipeline.id,
      testRuns,
      context,
    );

    const response = await globalGentraceApi.v1TestResultPost(body);
    return response.data;
  } catch (e) {
    throw e;
  } finally {
    decrementTestCounter();
  }
}

export async function runTest(
  pipelineSlug: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  contextOrCaseFilter?:
    | ResultContext
    | ((
        testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
      ) => boolean),
  caseFilterOrUndefined?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response> {
  const { context, caseFilter } = getContextTestCaseFilter(
    contextOrCaseFilter,
    caseFilterOrUndefined,
  );

  return runTestCore(pipelineSlug, handler, context, caseFilter);
}

/**
 * Runs a test for a given pipeline slug and dataset ID.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {string} datasetId: The ID of the dataset
 * @param {function} handler: The handler function that will be called for each test case
 * @param {ResultContext} [context]: An optional context object that will be passed to the Gentrace API
 * @param {function} [caseFilter]: An optional filter function that will be called for each test case
 */
export async function runTestWithDataset(
  pipelineSlug: string,
  datasetId: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  context?: ResultContext,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response>;

/**
 * Runs a test for a given pipeline slug and dataset ID.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {string} datasetId: The ID of the dataset
 * @param {function} handler: The handler function that will be called for each test case
 * @param {function} [caseFilter]: An optional filter function that will be called for each test case
 */
export async function runTestWithDataset(
  pipelineSlug: string,
  datasetId: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response>;

/**
 * Runs a test for a given pipeline slug and dataset ID.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {string} datasetId: The ID of the dataset
 * @param {function} handler: The handler function that will be called for each test case
 * @param {ResultContext | function} [contextOrCaseFilter]: An optional context object that will be passed to the Gentrace API
 * @param {function} [caseFilterOrUndefined]: An optional filter function that will be called for each test case
 */
export async function runTestWithDataset(
  pipelineSlug: string,
  datasetId: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  contextOrCaseFilter?:
    | ResultContext
    | ((
        testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
      ) => boolean),
  caseFilterOrUndefined?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response> {
  const { context, caseFilter } = getContextTestCaseFilter(
    contextOrCaseFilter,
    caseFilterOrUndefined,
  );

  return runTestCore(pipelineSlug, handler, context, caseFilter, datasetId);
}
