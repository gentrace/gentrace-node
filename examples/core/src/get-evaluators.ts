import { init, getEvaluators } from "@gentrace/core";

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  // example pipeline slug
  const pipelineSlug = "guess-the-year";
  const evaluatorsFromSlug = await getEvaluators(pipelineSlug);

  console.log(evaluatorsFromSlug);

  // example pipeline ID
  const pipelineId = "1dceb3fc-bbc3-5c1f-b7b8-69ad1ac7e870";
  const evaluatorsFromId = await getEvaluators(pipelineId);

  console.log(evaluatorsFromId);

  // get evaluator templates
  const evaluatorsTemplates = await getEvaluators(null);
  console.log(evaluatorsTemplates);
}

main();
