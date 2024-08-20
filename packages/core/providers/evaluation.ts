import { CreateEvaluationV2 } from "../models";
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
