import {
  TestCase,
  TestRunPost200Response,
  TestRunPostRequest,
  TestRunPostRequestTestResultsInner,
} from "../models";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
} from "./init";

export type TestResult = TestRunPostRequestTestResultsInner;

/**
 * Retrieves test cases for a given set ID from the Gentrace API
 * @async
 * @param {string} setId - The ID of the test set to retrieve.
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<TestCase>>} A Promise that resolves with an array of test cases.
 */
export const getTestCases = async (setId: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.testCaseGet(setId);
  const testCases = response.data.testCases ?? [];
  return testCases;
};

/**
 * Submits prepared test results to the Gentrace API for a given set ID. This method requires that you
 * create TestResult objects yourself. We recommend using the submitTestResults method instead.
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

  const body = constructSubmissionPayload(setId, testResults);

  const response = await globalGentraceApi.testRunPost(body);
  return response.data;
};

export const constructSubmissionPayload = (
  setId: string,
  testResults: TestResult[]
) => {
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
 * @param {string} setId - The identifier of the test set.
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
export const submitTestResults = async (
  setId: string,
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

  const testResults: TestResult[] = testCases.map((testCase, index) => {
    const result: TestResult = {
      caseId: testCase.id,
      inputs: testCase.inputs as { [key: string]: string },
      output: outputs[index],
    };

    if (outputSteps[index]) {
      result.outputSteps = outputSteps[index];
    }

    return result;
  });

  return submitPreparedTestResults(setId, testResults);
};
