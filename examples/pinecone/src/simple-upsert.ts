import { init } from "@gentrace/core";
import { Pinecone } from "@gentrace/pinecone";
import { DEFAULT_VECTOR } from "./utils";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY ?? "",
});

const INDEX_NAME = "example-index";

async function upsertPineconeIndex() {
  const index = await pinecone.Index(INDEX_NAME);

  const upsertResponse = await index.upsert(
    [
      {
        id: String(Math.floor(Math.random() * 10000)),
        values: [0, 1],
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
