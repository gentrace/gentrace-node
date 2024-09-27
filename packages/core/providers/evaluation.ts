import { CreateEvaluationV2, EvaluationV2 } from "../models";
import { globalGentraceApiV2 } from "./init";

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

export type EvaluationType = EvaluationV2;

/**
 * Retrieves evaluations for a specific result from the Gentrace API.
 * @async
 * @param {Object} params - The parameters for the function.
 * @param {string} params.resultId - The ID of the result to get evaluations for.
 * @returns {Promise<Array<EvaluationV2>>} - A promise that resolves to an array of evaluations.
 * @throws {Error} - Throws an error if the Gentrace API key is not initialized.
 */
export const getEvaluations = async ({
  resultId,
}: {
  resultId: string;
}): Promise<EvaluationV2[]> => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  if (!resultId) {
    throw new Error("resultId must be provided.");
  }

  const response = await globalGentraceApiV2.v2EvaluationsGet(resultId);
  return response.data.data ?? [];
};
