import { init } from "@gentrace/core";
import { runGraphInFile } from "@gentrace/rivet-node";
import { env } from "process";

init({
  apiKey: env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function processRivet() {
  console.log("Processing Rivet graph");

  const { outputs, pipelineRunId, pipelineRun } = await runGraphInFile(
    env.RIVET_PROJECT_FILE,
    {
      graph: env.RIVET_GRAPH_ID,
      openAiKey: env.OPENAI_KEY as string,
      inputs: {
        messages: {
          type: "object[]",
          value: [
            {
              type: "user",
              message: "What's the capital of Maine?",
            },
          ],
        },
      },
    },
    "testing-pipeline-id",
  );

  console.log("Outputs: ", outputs);
}

processRivet();
