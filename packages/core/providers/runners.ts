import { TestCase, TestCaseV2, V1TestResultPost200Response } from "../models";
import { ResultContext } from "./context";
import { globalGentraceApi } from "./init";
import { Pipeline } from "./pipeline";
import { GentracePlugin } from "./plugin";
import {
  constructSubmissionPayloadAdvanced,
  PipelineRunTestCaseTuple,
  TestRun,
} from "./test-result";
import {
  constructStepRuns,
  getContextTestCaseFilter,
  LocalTestData,
  isTestCaseOrTestCaseV2,
} from "./utils";

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
): Promise<Array<PipelineRunTestCaseTuple<TestCase | TestCaseV2>>> => {
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
  const testRunners: Array<PipelineRunTestCaseTuple<TestCase | TestCaseV2>> =
    [];

  for (const testCase of testCases) {
    if (caseFilter && !caseFilter(testCase)) {
      continue;
    }
    const pipelineRun = pipeline.start();
    testRunners.push([pipelineRun, testCase]);
  }
  return testRunners;
};

interface SubmitTestRunnersOptions {
  contextOrCaseFilter?:
    | ResultContext
    | ((
        testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
      ) => boolean);
  caseFilterOrUndefined?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean;
  triggerRemoteEvals?: boolean;
}

/**
 * Submits test runners for a given pipeline
 * @async
 * @param {Pipeline<{ [key: string]: GentracePlugin<any, any> }>} pipeline - The pipeline instance
 * @param {Array<PipelineRunTestCaseTuple>} pipelineRunTestCases - an array of PipelineRunTestCaseTuple
 * @param {SubmitTestRunnersOptions} [options] - Optional configuration for submitting test runners
 * @returns {Promise<V1TestResultPost200Response>} A Promise that resolves with the response from the Gentrace API
 */
export async function submitTestRunners(
  pipeline: Pipeline<{ [key: string]: GentracePlugin<any, any> }>,
  pipelineRunTestCases: Array<
    PipelineRunTestCaseTuple<TestCase | TestCaseV2 | LocalTestData>
  >,
  options: SubmitTestRunnersOptions = {},
): Promise<V1TestResultPost200Response> {
  const { contextOrCaseFilter, caseFilterOrUndefined, triggerRemoteEvals } =
    options;

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
      if (
        isTestCaseOrTestCaseV2(testCase) &&
        caseFilter &&
        !caseFilter(testCase)
      ) {
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
      triggerRemoteEvals,
    );

    console.log(
      "[SUBMIT_TEST_RUNNERS] Submission payload:",
      JSON.stringify(body, null, 2),
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
  runners: Array<
    PipelineRunTestCaseTuple<TestCase | TestCaseV2 | LocalTestData>
  >,
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

/**
 * Creates test runners for a given pipeline using locally provided test data
 * @param {Pipeline<{ [key: string]: GentracePlugin<any, any> }>} pipeline - The pipeline instance
 * @param {LocalTestData[]} localData - Array of local test data objects
 * @returns {Array<PipelineRunTestCaseTuple>} An array of PipelineRunTestCaseTuple
 */
export function createTestRunners(
  pipeline: Pipeline<{ [key: string]: GentracePlugin<any, any> }>,
  localData: LocalTestData[],
): Array<PipelineRunTestCaseTuple<LocalTestData>> {
  if (!pipeline) {
    throw new Error(`Invalid pipeline found`);
  }

  const testRunners: Array<PipelineRunTestCaseTuple<LocalTestData>> = [];

  for (const data of localData) {
    const pipelineRun = pipeline.start();
    const testCase = {
      name: data.name,
      inputs: data.inputs,
    };
    testRunners.push([pipelineRun, testCase]);
  }

  return testRunners;
}
