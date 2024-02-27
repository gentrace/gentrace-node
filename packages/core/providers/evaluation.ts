import {
  CreateEvaluationV2,
  CreateMultipleTestCases,
  CreateSingleTestCase,
  TestCase,
  TestCaseV2,
  UpdateTestCase,
  V1TestCasePost200Response,
  V1TestCasePost200ResponseOneOf,
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
import { PipelineRun } from "./pipeline-run";
import {
  decrementTestCounter,
  getProcessEnv,
  incrementTestCounter,
} from "./utils";

export type TestRun = V1TestResultPostRequestTestRunsInner;

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

  const response = await globalGentraceApi.v1TestCaseGet(pipelineId);
  const testCases = response.data.testCases ?? [];
  return testCases;
};

export const getTestCase = async (id: string) => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2TestCasesIdGet(id);
  const testCase = response.data;
  return testCase;
};

function isTestCaseSingle(
  response: V1TestCasePost200Response,
): response is V1TestCasePost200ResponseOneOf {
  return (response as V1TestCasePost200ResponseOneOf).caseId !== undefined;
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

  const response = await globalGentraceApi.v1TestCasePost(payload);
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

  const response = await globalGentraceApi.v1TestCasePost(payload);
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

  const response = await globalGentraceApi.v1TestCasePatch(payload);
  const data = response.data;

  return data.caseId;
};

export const constructSubmissionPayload = (
  pipelineId: string,
  testRuns: TestRun[],
  context?: ResultContext,
) => {
  const body: V1TestResultPostRequest = {
    pipelineId,
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

  const body: V1TestResultSimplePostRequest = {
    pipelineSlug,
    testRuns: testRuns,
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

  const response = await globalGentraceApi.v1TestResultSimplePost(body);
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

/**
 * Runs a test for a given pipeline slug.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {function} handler: The handler function that will be called for each test case
 * @param {ResultContext} [context]: An optional context object that will be passed to the Gentrace API
 * @param {function} [caseFilter]: An optional filter function that will be called for each test case
 */
export async function runTest(
  pipelineSlug: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  context?: ResultContext,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response>;

/**
 * Runs a test for a given pipeline slug.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {function} handler: The handler function that will be called for each test case
 * @param {function} [caseFilter]: An optional filter function that will be called for each test case
 */
export async function runTest(
  pipelineSlug: string,
  handler: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => Promise<[any, PipelineRun]>,
  caseFilter?: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean,
): Promise<V1TestResultPost200Response>;

/**
 * Runs a test for a given pipeline slug.
 * @param {string} pipelineSlug: The slug of the pipeline
 * @param {function} handler: The handler function that will be called for each test case
 * @param {ResultContext | function} [contextOrCaseFilter]: An optional context object that will be passed to the Gentrace API
 * @param {function} [caseFilterOrUndefined]: An optional filter function that will be called for each test case
 */
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
  incrementTestCounter();

  let context: ResultContext | undefined;
  let caseFilter: (
    testCase: Omit<TestCase, "createdAt" | "updatedAt" | "archivedAt">,
  ) => boolean | undefined;

  // Determine the overload being used based on the types of arguments
  if (typeof contextOrCaseFilter === "function") {
    caseFilter = contextOrCaseFilter;
    context = undefined;
  } else {
    context = contextOrCaseFilter;
    caseFilter = caseFilterOrUndefined;
  }

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
      if (caseFilter && !caseFilter(testCase)) {
        continue;
      }

      const [, pipelineRun] = await handler(testCase);

      let mergedMetadata = {};

      const updatedStepRuns = pipelineRun.stepRuns.map((stepRun) => {
        let {
          metadata: thisContextMetadata,
          previousRunId: _prPreviousRunId,
          ...restThisContext
        } = pipelineRun.context ?? {};

        let {
          metadata: stepRunContextMetadata,
          previousRunId: _srPreviousRunId,
          ...restStepRunContext
        } = stepRun.context ?? {};

        // Merge metadata
        mergedMetadata = {
          ...mergedMetadata,
          ...thisContextMetadata,
          ...stepRunContextMetadata,
        };

        return {
          modelParams: stepRun.modelParams,
          invocation: stepRun.invocation,
          inputs: stepRun.inputs,
          outputs: stepRun.outputs,
          providerName: stepRun.provider,
          elapsedTime: stepRun.elapsedTime,
          startTime: stepRun.startTime,
          endTime: stepRun.endTime,
          context: { ...restThisContext, ...restStepRunContext },
        };
      });

      const testRun: TestRun = {
        caseId: testCase.id,
        metadata: mergedMetadata,
        stepRuns: updatedStepRuns,
      };

      if (pipelineRun.getId()) {
        testRun.id = pipelineRun.getId();
      }

      testRuns.push(testRun);
    }

    if (!globalGentraceApi) {
      throw new Error("Gentrace API key not initialized. Call init() first.");
    }

    const body = constructSubmissionPayload(
      matchingPipeline.id,
      testRuns,
      context,
    );

    const response = await globalGentraceApi.v1TestResultPost(body);
    return response.data;
  } catch (e) {
    throw e;
  } finally {
    // Imperative that we decrement the test counter regardless of whether the function
    // runs into an error or not.
    decrementTestCounter();
  }
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
