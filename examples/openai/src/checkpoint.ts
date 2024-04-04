import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkpointTest() {
  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
  });

  const runner = pipeline.start();

  await sleep(1000);

  runner.checkpoint({
    providerName: "testing",
    invocation: "testing_invocation",
    inputs: {},
    outputs: {},
  });

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

checkpointTest();
