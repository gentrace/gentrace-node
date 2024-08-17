import {
  CreateMultipleTestCases,
  CreateSingleTestCase,
  TestCase,
  UpdateTestCase,
  V1TestCasePost200Response,
  V1TestCasePost200ResponseOneOf,
} from "../models";
import { globalGentraceApi, globalGentraceApiV2 } from "./init";
import { getPipelines } from "./pipeline-methods";

function isTestCaseSingle(
  response: V1TestCasePost200Response,
): response is V1TestCasePost200ResponseOneOf {
  return (response as V1TestCasePost200ResponseOneOf).caseId !== undefined;
}

function isUUID(str: string): boolean {
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidPattern.test(str);
}

/**
 * Retrieves test cases for a given pipeline from the Gentrace API.
 * @async
 * @param {string} pipelineSlug - The slug of the pipeline to filter test cases by.
 * @returns {Promise<Array<TestCase>>} - A promise that resolves to an array of test cases.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized or if the pipeline is not found.
 * @remarks The golden dataset for the specified pipeline will be used.
 */
export const getTestCases = async (
  pipelineSlug: string,
): Promise<TestCase[]> => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!pipelineSlug) {
    throw new Error("pipelineSlug must be defined.");
  }

  let pipelineId: string;

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
  } else {
    pipelineId = pipelineSlug;
  }

  const response = await globalGentraceApi.v1TestCaseGet(
    undefined,
    pipelineId,
    pipelineSlug,
  );
  return response.data.testCases ?? [];
};

/**
 * Retrieves test cases for a specific dataset from the Gentrace API.
 * @async
 * @param {string} datasetId - The ID of the dataset to retrieve test cases for.
 * @returns {Promise<Array<TestCase>>} - A promise that resolves to an array of test cases.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getTestCasesForDataset = async (
  datasetId: string,
): Promise<TestCase[]> => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!datasetId) {
    throw new Error("datasetId must be defined.");
  }

  const response = await globalGentraceApi.v1TestCaseGet(datasetId);
  return response.data.testCases ?? [];
};

export const getTestCase = async (id: string) => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2TestCasesIdGet(id);
  const testCase = response.data;
  return testCase;
};

/**
 * Creates a single test case for a given pipeline ID from the Gentrace API
 *
 * @async
 * @param {CreateSingleTestCase} payload - New test case payload
 * @throws {Error} Throws an error if the SDK is not initialized. Call init() first.
 * @returns {Promise<string>} A Promise that resolves to the created case ID
 * @remarks If a pipeline slug is specified, the golden dataset will be used.
 *          If a datasetId is provided, it will be used instead.
 */
export const createTestCase = async (payload: CreateSingleTestCase) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
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
 * @returns {Promise<string>} A Promise that resolves to the number of test cases successfully created
 * @remarks If a pipeline slug is specified, the golden dataset will be used.
 *          If a datasetId is provided, it will be used instead.
 */
export const createTestCases = async (payload: CreateMultipleTestCases) => {
  if (!globalGentraceApi) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApi.v1TestCasePost(payload);
  const data = response.data;

  if (isTestCaseSingle(data)) {
    throw new Error("Expected multiple test cases to be created.");
  }

  return data.creationCount;
};

/**
 * Updates a single test case in the Gentrace API
 *
 * @async
 * @param {UpdateTestCase} payload - The payload containing the test case update information
 * @throws {Error} Throws an error if the SDK is not initialized or if the test case ID is invalid
 * @returns {Promise<string>} A Promise that resolves to the updated case ID
 * @remarks This function updates an existing test case with the provided information.
 *          The payload should include the test case ID and any fields to be updated.
 */
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

/**
 * Deletes a single test case from the Gentrace API
 *
 * @async
 * @param {string} id - The ID of the test case to delete
 * @throws {Error} Throws an error if the SDK is not initialized or if the test case ID is invalid
 * @returns {Promise<boolean>} A Promise that resolves to true if the test case was successfully deleted
 * @remarks This function deletes an existing test case with the provided ID.
 */
export const deleteTestCase = async (id: string): Promise<boolean> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!isUUID(id)) {
    throw new Error("Expected a valid test case ID.");
  }

  const response = await globalGentraceApiV2.v2TestCasesIdDelete(id);
  return response.data.success;
};
