import { pinecone as pineconeBuilder } from "@gentrace/node/pinecone";
import { DEFAULT_VECTOR } from "../utils";

const pinecone = pineconeBuilder({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: {
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  },
});

async function queryPineconeIndex() {
  await pinecone.init();

  const index = await pinecone.Index("openai-trec");

  const queryResponse = await index.query({
    pipelineId: "pinecone-query-self-contained",
    queryRequest: {
      vector: DEFAULT_VECTOR,
      topK: 3,
      includeValues: true,
    },
  });

  console.log("queryResponse", queryResponse);
}

queryPineconeIndex();
