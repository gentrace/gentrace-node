import { init, Pipeline } from "@gentrace/node";
import { DEFAULT_VECTOR } from "../utils";

async function upsertPineconeIndex() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    slug: "pinecone-index-fetch-pipeline",
    pineconeConfig: {
      apiKey: process.env.PINECONE_API_KEY ?? "",
      environment: process.env.PINECONE_ENVIRONMENT ?? "",
    },
  });

  await pipeline.setup();
  const runner = pipeline.start();

  const pinecone = await runner.getPinecone();

  const index = await pinecone.Index("openai-trec");

  const upsertResponse = await index.upsert({
    upsertRequest: {
      vectors: [
        {
          id: String(Math.floor(Math.random() * 10000)),
          values: DEFAULT_VECTOR,
        },
      ],
    },
  });

  console.log("upsertResponse", upsertResponse);

  await runner.submit();
}

upsertPineconeIndex();
