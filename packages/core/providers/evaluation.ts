import {
  CreateEvaluationV2,
  TestCase,
  TestCaseV2,
  V1TestResultPost200Response,
  V1TestResultPostRequest,
  V1TestResultPostRequestTestRunsInner,
  V1TestResultSimplePostRequest,
  V1TestResultSimplePostRequestTestRunsInner,
  V1TestResultStatusGet200Response,
} from "../models";
import { ResultContext } from "./context";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RESULT_NAME,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
  globalGentraceApiV2,
} from "./init";
import { Pipeline } from "./pipeline";
import { PipelineRun } from "./pipeline-run";
import { GentracePlugin } from "./plugin";
import { getTestCases } from "./test-case";
import {
  decrementTestCounter,
  getContextTestCaseFilter,
  getProcessEnv,
  incrementTestCounter,
  constructStepRuns,
} from "./utils";

export type TestRun = V1TestResultPostRequestTestRunsInner;

/**
 * Retrieves evaluators for a given pipeline from the Gentrace API
 * @async
 * @param {string} pipelineIdentifier - The pipeline slug, pipeline ID, or null (for evaluator templates)

 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<EvaluatorV2>>} A Promise that resolves with an array of evaluators.
 */
export const getEvaluators = async (pipelineIdentifier: string | null) => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  let pipelineId = pipelineIdentifier;
  let pipelineSlug = pipelineIdentifier;

  if (pipelineIdentifier && isUUID(pipelineIdentifier)) {
    pipelineSlug = null; // no pipeline slug
  } else {
    pipelineId = null;
  }

  if (!pipelineIdentifier) {
    pipelineId = "null"; // get template evaluators
  }

  const response = await globalGentraceApiV2.v2EvaluatorsGet(
    pipelineId,
    pipelineSlug,
  );
  const evaluators = response.data.data ?? [];

  return evaluators;
};

export const constructSubmissionPayloadSimple = (
  pipelineSlug: string,
  testRuns: V1TestResultSimplePostRequestTestRunsInner[],
  context?: ResultContext,
) => {
  const body: V1TestResultSimplePostRequest = {
    pipelineSlug,
    testRuns,
  };

  // Will be overwritten if GENTRACE_RESULT_NAME is specified
  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_RESULT_NAME) {
    body.name = GENTRACE_RESULT_NAME;
  }

  if (context?.name) {
    body.name = context.name;
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

  if (context?.metadata) {
    body.metadata = context.metadata;
  }

  return body;
};

export const constructSubmissionPayloadAdvanced = (
  pipelineIdentifier: string,
  testRuns: TestRun[],
  context?: ResultContext,
) => {
  const body: V1TestResultPostRequest = {
    testRuns,
  };

  if (isUUID(pipelineIdentifier)) {
    body.pipelineId = pipelineIdentifier;
  } else {
    body.pipelineSlug = pipelineIdentifier;
  }

  // Will be overwritten if GENTRACE_RESULT_NAME is specified
  if (GENTRACE_RUN_NAME) {
    body.name = GENTRACE_RUN_NAME;
  }

  if (GENTRACE_RESULT_NAME) {
    body.name = GENTRACE_RESULT_NAME;
  }

  if (context?.name) {
    body.name = context.name;
  }

  if (context?.metadata) {
    body.metadata = context.metadata;
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
 * @param {(TestCase | TestCaseV2)[]} testCases - An array of TestCase objects.
 * @param {Record<string, any>[]} outputsList - An array of outputs corresponding to each TestCase.
 * @param {ResultContext} [context] - An optional context object that will be passed to the Gentrace API
 *
 * @throws {Error} Will throw an error if the Gentrace API key is not initialized. Also, will throw an error if the number of test cases
 *  does not match the number of outputs.
 *
 * @returns {Promise<V1TestResultPost200Response>} The response data from the Gentrace API's v1TestResultSimplePost method.
 */
export async function submitTestResult(
  pipelineSlug: string,
  testCases: (TestCase | TestCaseV2)[],
  outputsList: Record<string, any>[],
  context?: ResultContext,
): Promise<V1TestResultPost200Response> {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (testCases.length !== outputsList.length) {
    throw new Error(
      "The number of test cases must be equal to the number of outputs.",
    );
  }

  const testRuns: V1TestResultSimplePostRequestTestRunsInner[] = testCases.map(
    (testCase, index) => {
      const run: V1TestResultSimplePostRequestTestRunsInner = {
        caseId: testCase.id,
        inputs: testCase.inputs,
        outputs: outputsList[index],
      };

      return run;
    },
  );

  const body = constructSubmissionPayloadSimple(
    pipelineSlug,
    testRuns,
    context,
  );

  const response = await globalGentraceApi.v1TestResultSimplePost(body);
  return response.data;
}

/**
 * Updates a test result with the additional provided test cases and outputs.
 *
 * @async
 * @param {string} resultId - The ID of the test result to update.
 * @param {(TestCase | TestCaseV2)[]} testCases - An array of TestCase objects.
 * @param {Record<string, any>[]} outputsList - An array of outputs corresponding to each TestCase.
 * @returns {Promise<V1TestResultPost200Response>} A promise that resolves with the response data from the Gentrace API.
 * @throws {Error} Will throw an error if the number of test cases does not match the number of outputs.
 */
export async function updateTestResult(
  resultId: string,
  testCases: (TestCase | TestCaseV2)[],
  outputsList: Record<string, any>[],
) {
  if (testCases.length !== outputsList.length) {
    throw new Error(
      "The number of test cases must be equal to the number of outputs.",
    );
  }

  const testRuns: V1TestResultSimplePostRequestTestRunsInner[] = testCases.map(
    (testCase, index) => {
      const run: V1TestResultSimplePostRequestTestRunsInner = {
        caseId: testCase.id,
        inputs: testCase.inputs,
        outputs: outputsList[index],
      };

      return run;
    },
  );

  const response = await globalGentraceApi.v1TestResultSimpleIdPost(resultId, {
    testRuns,
  });
  return response.data;
}

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

  const response = await globalGentraceApi.v1PipelinesGet(...parameters);
  return response.data.pipelines;
};

/**
 * Retrieves a test result from the Gentrace API.
 * @async
 * @param {string} resultId - The ID of the test result.
 * @returns {Promise<ExpandedTestResult>} - A promise that resolves to the test result.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getTestResult = async (resultId: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestResultIdGet(resultId);
  const testResult = response.data;
  return testResult;
};

type StatusInfo = V1TestResultStatusGet200Response;

/**
 * Retrieves the status of a test result from the Gentrace API.
 * @async
 * @param {string} resultId - The ID of the test result.
 * @returns {Promise<StatusInfo>} - A promise that resolves to the test result.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getTestResultStatus = async (
  resultId: string,
): Promise<StatusInfo> => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestResultStatusGet(resultId);
  const statusInfo = response.data;
  return statusInfo;
};

/**
 * Retrieves test results from the Gentrace API.
 * @async
 * @param {string} pipelineSlug - The slug of the pipeline.
 * @returns {Promise<Array<TestResult>>} - A promise that resolves to the test results.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getTestResults = async (pipelineSlug?: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestResultGet(pipelineSlug);

  const testResults = response.data.testResults;
  return testResults;
};

export type PipelineRunTestCaseTuple = [PipelineRun, TestCase | TestCaseV2];

/**
 * Retrieves test runners for a given pipeline
 * @async
 * @param {Pipeline<{ [key: string]: GentracePlugin<any, any> }>} pipeline - The pipeline instance
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<Array<PipelineRunTestCaseTuple>>} A Promise that resolves with an array of PipelineRunTestCaseTuple.
 */
export const getTestRunners = async (
  pipeline: Pipeline<{ [key: string]: GentracePlugin<any, any> }>,
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
  if (pipeline.id) {
    response = await globalGentraceApi.v1TestCaseGet(pipeline.id);
  } else {
    response = await globalGentraceApi.v1TestCaseGet(null, pipeline.slug);
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

export type CreateEvaluationType = CreateEvaluationV2;

export async function bulkCreateEvaluations(
  evaluations: Array<CreateEvaluationV2>,
) {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2EvaluationsBulkPost({
    data: evaluations,
  });

  return response.data;
}
