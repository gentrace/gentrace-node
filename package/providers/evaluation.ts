import { TestRunPostRequestTestResultsInner } from "../models";
import { globalGentraceApi } from "./init";

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

  const response = await globalGentraceApi.testRunPost({
    setId,
    testResults,
  });
  return response.data;
};
