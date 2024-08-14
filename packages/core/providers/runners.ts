import { TestCase, V1TestResultPost200Response } from "../models";
import { ResultContext } from "./context";
import { globalGentraceApi } from "./init";
import { Pipeline } from "./pipeline";
import { GentracePlugin } from "./plugin";
import {
  constructSubmissionPayloadAdvanced,
  PipelineRunTestCaseTuple,
  TestRun,
} from "./test-result";
import { constructStepRuns, getContextTestCaseFilter } from "./utils";

/**
 * Retrieves test runners for a given pipeline
 * @async
 * @param {Pipeline<{ [key: string]: GentracePlugin<any, any> }>} pipeline - The pipeline instance
 * @param {string} [datasetId] - Optional dataset ID to filter test cases by.
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<PipelineRunTestCaseTuple>>} A Promise that resolves with an array of PipelineRunTestCaseTuple.
 */
export const getTestRunners = async (
  pipeline: Pipeline<{ [key: string]: GentracePlugin<any, any> }>,
  datasetId?: string,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<Array<PipelineRunTestCaseTuple>> => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!pipeline) {
    throw new Error(`Invalid pipeline found`);
  }

  // get test cases for the pipeline
  let response;
  if (datasetId) {
    response = await globalGentraceApi.v1TestCaseGet(
      datasetId,
      undefined,
      undefined,
    );
  } else if (pipeline.id) {
    response = await globalGentraceApi.v1TestCaseGet(
      undefined,
      pipeline.id,
      undefined,
    );
  } else {
    response = await globalGentraceApi.v1TestCaseGet(
      undefined,
      undefined,
      pipeline.slug,
    );
  }
  const testCases = response.data.testCases ?? [];

  // create tuples of pipeline run and test case
  const testRunners: Array<PipelineRunTestCaseTuple> = [];

  for (const testCase of testCases) {
    if (caseFilter && !caseFilter(testCase)) {
      continue;
    }
    const pipelineRun = pipeline.start();
    testRunners.push([pipelineRun, testCase]);
  }
  return testRunners;
};

/**
 * Submits test runners for a given pipeline
 * @async
 * @param {Pipeline<{ [key: string]: GentracePlugin<any, any> }>} pipeline - The pipeline instance
 * @param {Array<PipelineRunTestCaseTuple>} pipelineRunTestCases - an array of PipelineRunTestCaseTuple
 * @param {ResultContext | function} [contextOrCaseFilter]: An optional context object that will be passed to the Gentrace API
 * @param {function} [caseFilterOrUndefined]: An optional filter function that will be called for each test case
 */
export async function submitTestRunners(
  pipeline: Pipeline<{ [key: string]: GentracePlugin<any, any> }>,
  pipelineRunTestCases: Array<PipelineRunTestCaseTuple>,
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

  try {
    if (!pipeline) {
      throw new Error(`Invalid pipeline found`);
    }

    const testRuns: TestRun[] = [];

    for (const [pipelineRun, testCase] of pipelineRunTestCases) {
      if (caseFilter && !caseFilter(testCase)) {
        continue;
      }

      const testRun = constructStepRuns(testCase, pipelineRun);
      testRuns.push(testRun);
    }

    if (!globalGentraceApi) {
      throw new Error("Gentrace API key not initialized. Call init() first.");
    }

    const body = constructSubmissionPayloadAdvanced(
      pipeline.id ?? pipeline.slug,
      testRuns,
      context,
    );

    const response = await globalGentraceApi.v1TestResultPost(body);
    return response.data;
  } catch (e) {
    throw e;
  }
}

/**
 * Updates a test result with the provided runners.
 *
 * @async
 * @param {string} resultId - The ID of the test result to update.
 * @param {Array<PipelineRunTestCaseTuple>} runners - Additional test runs to add to the existing test result.
 * @returns {Promise<any>} A Promise that resolves with the response data from the Gentrace API.
 * @throws {Error} Throws an error if the update operation fails.
 */
export async function updateTestResultWithRunners(
  resultId: string,
  runners: Array<PipelineRunTestCaseTuple>,
) {
  const testRuns: TestRun[] = [];

  for (const [pipelineRun, testCase] of runners) {
    const testRun = constructStepRuns(testCase, pipelineRun);
    testRuns.push(testRun);
  }

  const response = await globalGentraceApi.v1TestResultIdPost(resultId, {
    testRuns,
  });
  return response.data;
}
