import { init, Pipeline } from "@gentrace/node";

async function createEmbedding() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    slug: "embedding-pipeline",
    openAIConfig: {
      apiKey: process.env.OPENAI_KEY,
    },
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openai = await runner.getOpenAI();

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: "testing",
  });

  console.log("embeddingResponse", embeddingResponse);

  await runner.submit();
}

createEmbedding();
