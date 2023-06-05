import {
  TestRunPostRequest,
  TestRunPostRequestTestResultsInner,
} from "../models";
import { GENTRACE_BRANCH, GENTRACE_COMMIT, globalGentraceApi } from "./init";

export type TestResult = TestRunPostRequestTestResultsInner;

export const getTestCases = async (setId: string) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.testCaseGet(setId);
  return response.data;
};

export const submitTestResults = async (
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

  if (GENTRACE_BRANCH) {
    body.branch = GENTRACE_BRANCH;
  }

  if (GENTRACE_COMMIT) {
    body.commit = GENTRACE_COMMIT;
  }

  const response = await globalGentraceApi.testRunPost(body);
  return response.data;
};
