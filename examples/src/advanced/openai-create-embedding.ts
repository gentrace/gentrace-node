import { init, Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function createEmbedding() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    id: "embedding-pipeline",
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
