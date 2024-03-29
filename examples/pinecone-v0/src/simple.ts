import { init } from "@gentrace/core";
import { PineconeClient } from "@gentrace/pinecone-v0";
import { DEFAULT_VECTOR } from "./utils";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const pinecone = new PineconeClient();

async function upsertPineconeIndex() {
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const index = await pinecone.Index("openai-trec");

  const upsertResponse = await index.upsert({
    pipelineSlug: "testing-pipeline-id",
    upsertRequest: {
      vectors: [
        {
          id: String(Math.floor(Math.random() * 10000)),
          values: DEFAULT_VECTOR,
        },
      ],
    },
  });
  console.log("upsertResponse", upsertResponse, upsertResponse.pipelineRunId);
}

upsertPineconeIndex();
