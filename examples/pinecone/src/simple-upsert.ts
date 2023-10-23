import { init } from "@gentrace/core";
import { Pinecone } from "@gentrace/pinecone";
import { DEFAULT_VECTOR } from "./utils";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? "",
  environment: process.env.PINECONE_ENVIRONMENT ?? "",
});

async function upsertPineconeIndex() {
  const index = await pinecone.Index("openai-trec").namespace("testing");

  const upsertResponse = await index.upsert(
    [
      {
        id: String(Math.floor(Math.random() * 10000)),
        values: DEFAULT_VECTOR,
      },
    ],
    {
      pipelineSlug: "testing-pipeline-id",
      gentrace: {
        userId: "testing-user-id",
      },
    },
  );
  console.log("upsertResponse", upsertResponse, upsertResponse.pipelineRunId);
}

upsertPineconeIndex();
