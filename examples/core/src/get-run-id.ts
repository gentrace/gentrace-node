import { init, getRun } from "@gentrace/core";

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  // example runID
  const runID = "5615b021-03cd-4cd9-9bc8-6a2f7bf4240e";
  const runData = await getRun(runID);

  console.log(runData);
  console.log(runData.stepRuns[0].inputs);
  console.log(runData.stepRuns[0].outputs);
}

main();
