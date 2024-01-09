import {
  bulkCreateEvaluations,
  CreateEvaluationType,
  getTestResult,
  init,
} from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function main() {
  const result = await getTestResult("492ef124-aca1-4640-8c9c-641c874acdb7");
  console.log("Runs", result.runs);

  const evaluationPayloads: CreateEvaluationType[] = result.runs.map((run) => {
    return {
      note: "test note",
      evaluatorId: "e1117752-01fe-568c-9ee0-5e160352031d",
      runId: run.id,
      evalLabel: "A",
    };
  });

  const creationCount = await bulkCreateEvaluations(evaluationPayloads);

  console.log("Creation count", creationCount);
}

main();
