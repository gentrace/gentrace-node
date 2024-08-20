import { globalGentraceApiV2 } from "./init";

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

function isUUID(str: string): boolean {
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidPattern.test(str);
}
