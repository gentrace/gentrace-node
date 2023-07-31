import {
  Pipeline,
  TestCase,
  TestResultPostRequest,
  TestResultPostRequestTestRunsInner,
  TestRunPostRequestTestResultsInner,
  TestRunPostRequest,
} from "../models";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
} from "./init";
import { PipelineRun } from "./pipeline-run";

export type TestRun = TestResultPostRequestTestRunsInner;
export type TestResult = TestRunPostRequestTestResultsInner;

/**
 * Retrieves test cases for a given pipeline ID from the Gentrace API
 * @async
 * @param {string} pipelineId - The ID of the pipeline to retrieve.
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<TestCase>>} A Promise that resolves with an array of test cases.
 */
export const getTestCases = async (pipelineId: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.testCaseGet(pipelineId);
  const testCases = response.data.testCases ?? [];
  return testCases;
};

/**
 * @deprecated Use {@link runTest} instead.
 * Submits prepared test results to the Gentrace API for a given set ID. This method requires that you
 * create TestResult objects yourself. We recommend using the submitTestResults method instead.
 *
 * NOTE: We have renamed TestResult -> TestRun, TestRun -> TestResult, and TestSet -> Pipeline.
 *
 * @async
 * @param {string} setId - The ID of the test set associated with the test results.
 * @param {Array<TestResult>} testResults - An array of test results to submit.
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<TestRunPost200Response>} A Promise that resolves with the response data from the API.
 */
export const submitPreparedTestResults = async (
  setId: string,
  testResults: TestResult[]
) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const body: TestRunPostRequest = {
    setId,
    testResults,
  };

  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_BRANCH || process.env.GENTRACE_BRANCH) {
    body.branch =
      GENTRACE_BRANCH.length > 0
        ? GENTRACE_BRANCH
        : process.env.GENTRACE_BRANCH;
  }

  if (GENTRACE_COMMIT || process.env.GENTRACE_COMMIT) {
    body.commit =
      GENTRACE_COMMIT.length > 0
        ? GENTRACE_COMMIT
        : process.env.GENTRACE_COMMIT;
  }

  const response = await globalGentraceApi.testRunPost(body);
  return response.data;
};

export const constructSubmissionPayload = (
  pipelineId: string,
  testRuns: TestRun[]
) => {
  const body: TestResultPostRequest = {
    pipelineId,
    testRuns,
  };

  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_BRANCH || process.env.GENTRACE_BRANCH) {
    body.branch =
      GENTRACE_BRANCH.length > 0
        ? GENTRACE_BRANCH
        : process.env.GENTRACE_BRANCH;
  }

  if (GENTRACE_COMMIT || process.env.GENTRACE_COMMIT) {
    body.commit =
      GENTRACE_COMMIT.length > 0
        ? GENTRACE_COMMIT
        : process.env.GENTRACE_COMMIT;
  }

  body.collectionMethod = "runner";

  return body;
};

/**
 * Submits test results by creating TestResult objects from given test cases and corresponding outputs.
 * @deprecated Use {@link runTest} instead.
 *
 * NOTE: We have renamed TestResult -> TestRun, TestRun -> TestResult, and TestSet -> Pipeline.
 *
 * @async
 * @function
 * @param {string} pipelineId - The identifier of the pipeline.
 * @param {TestCase[]} testCases - An array of TestCase objects.
 * @param {string[]} outputs - An array of outputs corresponding to each TestCase.
 *
 * @throws {Error} Will throw an error if the Gentrace API key is not initialized. Also, will throw an error if the number of test cases
 *  does not match the number of outputs.
 *
 * @returns {Promise<TestRunPost200Response>} The response data from the Gentrace API's testRunPost method.
 */
export const submitTestResult = async (
  pipelineId: string,
  testCases: TestCase[],
  outputsList: Record<string, any>[]
) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (testCases.length !== outputsList.length) {
    throw new Error(
      "The number of test cases must be equal to the number of outputs."
    );
  }

  const testRuns: TestRunPostRequestTestResultsInner[] = testCases.map(
    (testCase, index) => {
      const run: TestRunPostRequestTestResultsInner = {
        caseId: testCase.id,
        inputs: testCase.inputs,
        outputs: outputsList[index],
      };

      return run;
    }
  );

  const body: TestRunPostRequest = {
    setId: pipelineId,
    testResults: testRuns,
  };

  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_BRANCH || process.env.GENTRACE_BRANCH) {
    body.branch =
      GENTRACE_BRANCH.length > 0
        ? GENTRACE_BRANCH
        : process.env.GENTRACE_BRANCH;
  }

  if (GENTRACE_COMMIT || process.env.GENTRACE_COMMIT) {
    body.commit =
      GENTRACE_COMMIT.length > 0
        ? GENTRACE_COMMIT
        : process.env.GENTRACE_COMMIT;
  }

  const response = await globalGentraceApi.testRunPost(body);
  return response.data;
};

type PipelineParams = {
  label?: string;
  slug?: string;
};

/**
 * Retrieves pipelines from the Gentrace API.
 * @async
 * @param {PipelineParams} [params] - Optional parameters to filter the pipelines.
 * @returns {Promise<Array<Pipeline>>} - A promise that resolves to an array of pipelines.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getPipelines = async (params?: PipelineParams) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const label = (params ?? {}).label;
  const slug = (params ?? {}).slug;

  const parameters: (string | undefined)[] = [label, slug];

  const response = await globalGentraceApi.pipelinesGet(...parameters);
  return response.data.pipelines;
};

/**
 * Runs a test for a specific pipeline.
 *
 * @param {string} pipelineSlug - The slug of the pipeline.
 * @param {(testCase: TestCase) => Promise<PipelineRun>} handler - The handler function that runs the test case and returns a promise with a PipelineRun.
 * @returns {Promise<TestRun>} - A promise that resolves to the test result.
 * @throws {Error} - Throws an error if the specified pipeline cannot be found.
 */
export const runTest = async (
  pipelineSlug: string,
  handler: (testCase: TestCase) => Promise<[any, PipelineRun]>
) => {
  const allPipelines = await getPipelines();

  const matchingPipeline = allPipelines.find(
    (pipeline) => pipeline.slug === pipelineSlug
  );

  if (!matchingPipeline) {
    throw new Error(`Could not find the specified pipeline (${pipelineSlug})`);
  }

  const testCases = await getTestCases(matchingPipeline.id);

  const testRuns: TestRun[] = [];

  for (const testCase of testCases) {
    const [, pipelineRun] = await handler(testCase);

    testRuns.push({
      caseId: testCase.id,
      stepRuns: pipelineRun.stepRuns.map((stepRun) => ({
        provider: {
          modelParams: stepRun.modelParams,
          invocation: stepRun.invocation,
          inputs: stepRun.inputs,
          outputs: stepRun.outputs,
          name: stepRun.provider,
        },
        elapsedTime: stepRun.elapsedTime,
        startTime: stepRun.startTime,
        endTime: stepRun.endTime,
      })),
    });
  }

  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const body = constructSubmissionPayload(matchingPipeline.id, testRuns);

  const response = await globalGentraceApi.testResultPost(body);
  return response.data;
};
