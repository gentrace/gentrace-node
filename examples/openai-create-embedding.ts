import { Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function createEmbedding() {
  const pipeline = new Pipeline({
    id: "embedding-pipeline",
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    // TODO: change to prod at some point
    basePath: "http://localhost:3000/api/v1",
    openAIConfig: new Configuration({
      apiKey: process.env.OPENAI_KEY,
    }),
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.getOpenAI();

  const embeddingResponse = await openAi.createEmbedding({
    model: "text-embedding-ada-002",
    input: "testing",
  });

  console.log("embeddingResponse", embeddingResponse);

  await runner.submit();
}

createEmbedding();
