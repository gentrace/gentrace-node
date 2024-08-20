import {
  V1TestResultPost200Response,
  V1TestResultPostRequest,
  V1TestResultPostRequestTestRunsInner,
  V1TestResultSimplePostRequest,
  V1TestResultSimplePostRequestTestRunsInner,
  V1TestResultStatusGet200Response,
  TestCase,
  TestCaseV2,
} from "../models";
import { ResultContext } from "./context";
import {
  GENTRACE_BRANCH,
  GENTRACE_COMMIT,
  GENTRACE_RESULT_NAME,
  GENTRACE_RUN_NAME,
  globalGentraceApi,
} from "./init";
import { PipelineRun } from "./pipeline-run";
import { getProcessEnv } from "./utils";

export type TestRun = V1TestResultPostRequestTestRunsInner;

export type PipelineRunTestCaseTuple = [PipelineRun, TestCase | TestCaseV2];

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

export const getTestResult = async (resultId: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestResultIdGet(resultId);
  const testResult = response.data;
  return testResult;
};

type StatusInfo = V1TestResultStatusGet200Response;

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

export const getTestResults = async (pipelineSlug?: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestResultGet(pipelineSlug);

  const testResults = response.data.testResults;
  return testResults;
};
