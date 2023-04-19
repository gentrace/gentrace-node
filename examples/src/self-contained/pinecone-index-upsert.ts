import { PineconeClient } from "@gentrace/node/pinecone";
import { DEFAULT_VECTOR } from "../utils";

const pinecone = new PineconeClient({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
});

async function upsertPineconeIndex() {
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const index = await pinecone.Index("openai-trec");

  const upsertResponse = await index.upsert({
    pipelineId: "pinecone-upsert-self-contained",
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