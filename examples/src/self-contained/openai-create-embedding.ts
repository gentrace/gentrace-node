import { OpenAIApi, Configuration } from "@gentrace/node/openai";

const openai = new OpenAIApi(
  new Configuration({
    gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
    gentraceBasePath: "http://localhost:3000/api/v1",
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createEmbedding() {
  const embeddingResponse = await openai.createEmbedding({
    pipelineId: "testing-pipeline-id",
    model: "text-embedding-ada-002",
    input: "testing",
  });

  console.log("embeddingResponse", embeddingResponse);
}

createEmbedding();
