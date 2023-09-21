import {
  CreateMultipleTestCases,
  CreateSingleTestCase,
  Pipeline,
  TestCase,
  TestCasePost200Response,
  TestCasePost200ResponseOneOf,
  TestResultPostRequest,
  TestResultPostRequestTestRunsInner,
  TestResultSimplePostRequest,
  TestResultSimplePostRequestTestRunsInner,
  UpdateTestCase,
} from "../models";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
} from "./init";
import { PipelineRun } from "./pipeline-run";
import {
  decrementTestCounter,
  getProcessEnv,
  incrementTestCounter,
} from "./utils";

export type TestRun = TestResultPostRequestTestRunsInner;

/**
 * Retrieves test cases for a given pipeline ID from the Gentrace API
 * @async
 * @param {string} pipelineSlug - The pipeline slug
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<TestCase>>} A Promise that resolves with an array of test cases.
 */
export const getTestCases = async (pipelineSlug: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  let pipelineId = pipelineSlug;

  if (!isUUID(pipelineSlug)) {
    const allPipelines = await getPipelines();

    const matchingPipeline = allPipelines.find(
      (pipeline) => pipeline.slug === pipelineSlug,
    );

    if (!matchingPipeline) {
      throw new Error(
        `Could not find the specified pipeline (${pipelineSlug})`,
      );
    }

    pipelineId = matchingPipeline.id;
  }

  const response = await globalGentraceApi.testCaseGet(pipelineId);
  const testCases = response.data.testCases ?? [];
  return testCases;
};

function isTestCaseSingle(
  response: TestCasePost200Response,
): response is TestCasePost200ResponseOneOf {
  return (response as TestCasePost200ResponseOneOf).caseId !== undefined;
}

/**
 * Creates a single test case for a given pipeline ID from the Gentrace API
 *
 * @async
 * @param {CreateSingleTestCase} payload - New test case payload
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<string>} A Promise that resolves to the created case ID
 */
export const createTestCase = async (payload: CreateSingleTestCase) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const { pipelineSlug } = payload;

  let pipelineId = pipelineSlug;

  if (!isUUID(pipelineSlug)) {
    const allPipelines = await getPipelines();

    const matchingPipeline = allPipelines.find(
      (pipeline) => pipeline.slug === pipelineSlug,
    );

    if (!matchingPipeline) {
      throw new Error(
        `Could not find the specified pipeline (${pipelineSlug})`,
      );
    }

    pipelineId = matchingPipeline.id;
  }

  const response = await globalGentraceApi.testCasePost(payload);
  const data = response.data;

  if (!isTestCaseSingle(data)) {
    throw new Error("Expected a single test case to be created.");
  }

  return data.caseId;
};

/**
 * Creates multiple test cases for a given pipeline ID from the Gentrace API
 *
 * @async
 * @param {CreateMultipleTestCases} payload - New test case payloads
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<stringl>} A Promise that resolves to the number of test cases successfully created
 */
export const createTestCases = async (payload: CreateMultipleTestCases) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const { pipelineSlug } = payload;

  let pipelineId = pipelineSlug;

  if (!isUUID(pipelineSlug)) {
    const allPipelines = await getPipelines();

    const matchingPipeline = allPipelines.find(
      (pipeline) => pipeline.slug === pipelineSlug,
    );

    if (!matchingPipeline) {
      throw new Error(
        `Could not find the specified pipeline (${pipelineSlug})`,
      );
    }

    pipelineId = matchingPipeline.id;
  }

  const response = await globalGentraceApi.testCasePost(payload);
  const data = response.data;

  if (isTestCaseSingle(data)) {
    throw new Error("Expected multiple test cases to be created.");
  }

  return data.creationCount;
};

export const updateTestCase = async (payload: UpdateTestCase) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const { id } = payload;

  if (!isUUID(id)) {
    throw new Error("Expected a valid test case ID.");
  }

  const response = await globalGentraceApi.testCasePatch(payload);
  const data = response.data;

  return data.caseId;
};

export const constructSubmissionPayload = (
  pipelineId: string,
  testRuns: TestRun[],
) => {
  const body: TestResultPostRequest = {
    pipelineId,
    testRuns,
  };

  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_BRANCH || getProcessEnv("GENTRACE_BRANCH")) {
    body.branch =
      GENTRACE_BRANCH.length > 0
        ? GENTRACE_BRANCH
        : getProcessEnv("GENTRACE_BRANCH");
  }

  if (GENTRACE_COMMIT || getProcessEnv("GENTRACE_COMMIT")) {
    body.commit =
      GENTRACE_COMMIT.length > 0
        ? GENTRACE_COMMIT
        : getProcessEnv("GENTRACE_COMMIT");
  }

  body.collectionMethod = "runner";

  return body;
};

function isUUID(str: string): boolean {
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidPattern.test(str);
}

/**
 * Submits test results by creating TestResult objects from given test cases and corresponding outputs.
 * To use a Gentrace runner to capture intermediate steps, use {@link runTest} instead.
 *
 * @async
 * @function
 * @param {string} pipelineSlug - The slug of the pipeline
 * @param {TestCase[]} testCases - An array of TestCase objects.
 * @param {string[]} outputs - An array of outputs corresponding to each TestCase.
 *
 * @throws {Error} Will throw an error if the Gentrace API key is not initialized. Also, will throw an error if the number of test cases
 *  does not match the number of outputs.
 *
 * @returns {Promise<TestRunPost200Response>} The response data from the Gentrace API's testRunPost method.
 */
export const submitTestResult = async (
  pipelineSlug: string,
  testCases: TestCase[],
  outputsList: Record<string, any>[],
) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (testCases.length !== outputsList.length) {
    throw new Error(
      "The number of test cases must be equal to the number of outputs.",
    );
  }

  const testRuns: TestResultSimplePostRequestTestRunsInner[] = testCases.map(
    (testCase, index) => {
      const run: TestResultSimplePostRequestTestRunsInner = {
        caseId: testCase.id,
        inputs: testCase.inputs,
        outputs: outputsList[index],
      };

      return run;
    },
  );

  const body: TestResultSimplePostRequest = {
    pipelineSlug,
    testRuns: testRuns,
  };

  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_BRANCH || getProcessEnv("GENTRACE_BRANCH")) {
    body.branch =
      GENTRACE_BRANCH.length > 0
        ? GENTRACE_BRANCH
        : getProcessEnv("GENTRACE_BRANCH");
  }

  if (GENTRACE_COMMIT || getProcessEnv("GENTRACE_COMMIT")) {
    body.commit =
      GENTRACE_COMMIT.length > 0
        ? GENTRACE_COMMIT
        : getProcessEnv("GENTRACE_COMMIT");
  }

  const response = await globalGentraceApi.testResultSimplePost(body);
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
  handler: (testCase: TestCase) => Promise<[any, PipelineRun]>,
) => {
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

    const testCases = await getTestCases(matchingPipeline.id);

    const testRuns: TestRun[] = [];

    for (const testCase of testCases) {
      const [, pipelineRun] = await handler(testCase);

      const testRun: TestRun = {
        caseId: testCase.id,
        stepRuns: pipelineRun.stepRuns.map((stepRun) => ({
          modelParams: stepRun.modelParams,
          invocation: stepRun.invocation,
          inputs: stepRun.inputs,
          outputs: stepRun.outputs,
          providerName: stepRun.provider,
          elapsedTime: stepRun.elapsedTime,
          startTime: stepRun.startTime,
          endTime: stepRun.endTime,
          context: { ...pipelineRun.context, ...stepRun.context },
        })),
      };

      if (pipelineRun.getId()) {
        testRun.id = pipelineRun.getId();
      }

      testRuns.push(testRun);
    }

    if (!globalGentraceApi) {
      throw new Error("Gentrace API key not initialized. Call init() first.");
    }

    const body = constructSubmissionPayload(matchingPipeline.id, testRuns);

    const response = await globalGentraceApi.testResultPost(body);
    return response.data;
  } catch (e) {
    throw e;
  } finally {
    // Imperative that we decrement the test counter regardless of whether the function
    // runs into an error or not.
    decrementTestCounter();
  }
};
