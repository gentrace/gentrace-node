import { init, Pipeline } from "@gentrace/core";
import { initPlugin, Pinecone } from "@gentrace/pinecone";
import { DEFAULT_VECTOR, SMALL_VECTOR } from "./utils";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  const pineconeSimple = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });

  const plugin = await initPlugin(pineconeSimple);

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      pinecone: plugin,
    },
  });

  const INDEX_NAME = "example-index-2";

  const runner = pipeline.start();

  const pinecone = await runner.pinecone;

  const index = await pinecone.Index(INDEX_NAME).namespace("test");

  try {
    const upsertResponse = await index.upsert([
      {
        id: String(Math.floor(Math.random() * 10000)),
        values: SMALL_VECTOR,
      },
    ]);

    console.log("upsertResponse", upsertResponse);
  } catch (e) {
    console.error("monkies", e.message);
    return;
  }

  const submitResponse = await runner.submit();

  console.log("submitResponse", submitResponse);
}

createChatCompletion();
