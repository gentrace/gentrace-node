import { init, Pipeline } from "@gentrace/core";
import { initPlugin } from "@gentrace/pinecone";
import { DEFAULT_VECTOR, SMALL_VECTOR } from "./utils";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  const plugin = await initPlugin({
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      pinecone: plugin,
    },
  });

  const INDEX_NAME = "example-index-2";

  const runner = pipeline.start();

  const pinecone = await runner.pinecone;

  const index = await pinecone.Index(INDEX_NAME);

  try {
    const queryResponse = await index.query({
      includeValues: true,
      topK: 3,
      vector: SMALL_VECTOR,
    });

    console.log("Query response:", queryResponse.matches);
  } catch (e) {
    return;
  }

  await runner.submit();
}

createChatCompletion();
