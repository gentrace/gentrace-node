import { CreateDatasetV2, DatasetV2, UpdateDatasetV2 } from "../models";
import { globalGentraceApiV2 } from "./init";

/**
 * Retrieves datasets from the Gentrace API.
 * @async
 * @param {Object} [params] - Optional parameters to filter the datasets.
 * @param {string} [params.pipelineSlug] - The slug of the pipeline to filter datasets by.
 * @param {string} [params.pipelineId] - The ID of the pipeline to filter datasets by.
 * @param {boolean} [params.archived] - Filter datasets by archived status.
 * @returns {Promise<Array<DatasetV2>>} - A promise that resolves to an array of datasets.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getDatasets = async (params?: {
  pipelineSlug?: string;
  pipelineId?: string;
  archived?: boolean;
}): Promise<DatasetV2[]> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!params?.pipelineSlug && !params?.pipelineId) {
    throw new Error("Either pipelineSlug or pipelineId must be defined.");
  }

  const response = await globalGentraceApiV2.v2DatasetsGet(
    params?.pipelineSlug,
    params?.pipelineId,
    params?.archived,
  );
  return response.data.data ?? [];
};

/**
 * Creates a new dataset in the Gentrace API.
 * @async
 * @param {CreateDatasetV2} payload - The dataset creation payload.
 * @returns {Promise<DatasetV2>} - A promise that resolves to the created dataset.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const createDataset = async (
  payload: CreateDatasetV2,
): Promise<DatasetV2> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2DatasetsPost(payload);
  return response.data;
};

/**
 * Retrieves a single dataset from the Gentrace API.
 * @async
 * @param {string} id - The ID of the dataset to retrieve.
 * @returns {Promise<DatasetV2>} - A promise that resolves to the retrieved dataset.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getDataset = async (id: string): Promise<DatasetV2> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2DatasetsIdGet(id);
  return response.data;
};

/**
 * Updates a dataset in the Gentrace API.
 * @async
 * @param {string} id - The ID of the dataset to update.
 * @param {UpdateDatasetV2} payload - The dataset update payload.
 * @returns {Promise<DatasetV2>} - A promise that resolves to the updated dataset.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const updateDataset = async (
  id: string,
  payload: UpdateDatasetV2,
): Promise<DatasetV2> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2DatasetsIdPost(id, payload);
  return response.data;
};
