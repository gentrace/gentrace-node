import { init } from "@gentrace/node";
import { OpenAIApi, Configuration } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createEmbedding() {
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: "testing",
    pipelineId: "testing-pipeline-id",
  });

  console.log(
    "Embedding response:",
    embeddingResponse,
    embeddingResponse.pipelineRunId
  );
}

createEmbedding();
