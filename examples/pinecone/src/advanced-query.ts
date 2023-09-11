import { init, Pipeline } from "@gentrace/core";
import { initPlugin } from "@gentrace/pinecone";
import { DEFAULT_VECTOR } from "./utils";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const plugin = await initPlugin({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      pinecone: plugin,
    },
  });

  const runner = pipeline.start();

  const pinecone = await runner.pinecone;

  const index = await pinecone.Index("openai-trec");

  try {
    const queryResponse = await index.query({
      includeValues: true,
      topK: 3,
      vector: DEFAULT_VECTOR,
    });

    console.log("Query response:", queryResponse.matches);
  } catch (e) {
    return;
  }

  await runner.submit();
}

createChatCompletion();
