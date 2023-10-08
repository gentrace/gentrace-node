import { init } from "@gentrace/core";
import { runGraphInFile } from "@gentrace/rivet-node";
import { env } from "process";

init({
  apiKey: env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const RIVET_PROJECT_FILE = "./projects/chat.rivet-project";
const RIVET_GRAPH_ID = "r97vYKQCVceae5VCCKK4J";

async function processRivet() {
  console.log("Processing Rivet graph");

  const outputs = await runGraphInFile(
    RIVET_PROJECT_FILE,
    {
      graph: RIVET_GRAPH_ID,
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
}

processRivet();
