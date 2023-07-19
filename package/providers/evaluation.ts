import {
  Pipeline,
  TestCase,
  TestResultPostRequest,
  TestResultPostRequestTestRunsInner,
} from "../models";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
} from "./init";

export type TestRun = TestResultPostRequestTestRunsInner;

/**
 * Retrieves test cases for a given set ID from the Gentrace API
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
 * Submits prepared test run to the Gentrace API for a given pipeline ID. This method requires that you
 * create TestRun objects yourself. We recommend using the submitTestRun method instead.
 * @async
 * @param {string} pipelineId - The ID of the pipeline associated with the test results.
 * @param {Array<TestRun>} testRuns - An array of test runs to submit.
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<TestRunPost200Response>} A Promise that resolves with the response data from the API.
 */
export const submitPreparedTestResult = async (
  pipelineId: string,
  testRuns: TestRun[]
) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const body = constructSubmissionPayload(pipelineId, testRuns);

  const response = await globalGentraceApi.testResultPost(body);
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

  return body;
};

type OutputStep = {
  key: string;
  output: string;
  inputs?: { [key: string]: any };
};

/**
 * Submits test results by creating TestResult objects from given test cases and corresponding outputs.
 * @async
 * @function
 * @param {string} pipelineId - The identifier of the test set.
 * @param {TestCase[]} testCases - An array of TestCase objects.
 * @param {string[]} outputs - An array of outputs corresponding to each TestCase.
 * @param {OutputStep[][]} [outputSteps=[]] - An optional array of arrays of `OutputStep` objects, where each inner array corresponds to
 *  the steps taken to generate the corresponding output.
 *
 * @throws {Error} Will throw an error if the Gentrace API key is not initialized. Also, will throw an error if the number of test cases
 *  does not match the number of outputs.
 *
 * @returns {Promise<TestRunPost200Response>} The response data from the Gentrace API's testRunPost method.
 */
export const submitTestResult = async (
  pipelineId: string,
  testCases: TestCase[],
  outputs: string[],
  outputSteps: OutputStep[][] = []
) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (testCases.length !== outputs.length) {
    throw new Error(
      "The number of test cases must be equal to the number of outputs."
    );
  }

  const testRuns: TestRun[] = testCases.map((testCase, index) => {
    const result: TestRun = {
      caseId: testCase.id,
      inputs: testCase.inputs as { [key: string]: string },
      output: outputs[index],
    };

    if (outputSteps[index]) {
      result.outputSteps = outputSteps[index];
    }

    return result;
  });

  return submitPreparedTestResult(pipelineId, testRuns);
};

type PipelineParams = {
  label: string;
};

/**
 * Retrieves pipelines from the Gentrace API.
 * @async
 * @param {PipelineParams} [params] - Optional parameters to filter the test sets.
 * @returns {Promise<Array<Pipeline>>} - A promise that resolves to an array of test sets.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getPipelines = async (params?: PipelineParams) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const label = (params ?? {}).label;

  if (label) {
    const response = await globalGentraceApi.pipelinesGet(label);
    return response.data.pipelines;
  } else {
    const response = await globalGentraceApi.pipelinesGet();
    return response.data.pipelines;
  }
};

export const runTest = async (
  pipelineSlug: string,
  handler: (testCase: TestCase, runner) => Promise<void>
) => {
  const allPipelines = await getPipelines();

  allPipelines.find((pipeline) => pipeline.slug === pipelineSlug);

  if (matchingPipelines.length === 0) {
    throw new Error("");
  }

  const testCases = await getTestCases(pipelineId);

  for (const testCase of testCases) {
    console.log("Running test case: ", testCase.id);
  }
};
