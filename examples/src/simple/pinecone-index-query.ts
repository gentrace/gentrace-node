import { init } from "@gentrace/node";
import { PineconeClient } from "@gentrace/node/pinecone";
import { DEFAULT_VECTOR } from "../utils";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const pinecone = new PineconeClient();

async function queryPineconeIndex() {
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const index = await pinecone.Index("openai-trec");

  const queryResponse = await index.query({
    pipelineId: "pinecone-query-self-contained",
    queryRequest: {
      vector: DEFAULT_VECTOR,
      topK: 3,
      includeValues: true,
    },
  });

  console.log("queryResponse", queryResponse.pipelineRunId);
}

queryPineconeIndex();
