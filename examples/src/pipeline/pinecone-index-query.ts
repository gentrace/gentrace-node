import { Pipeline } from "@gentrace/node";
import { DEFAULT_VECTOR } from "../utils";

async function queryPineconeIndex() {
  const pipeline = new Pipeline({
    id: "pinecone-index-fetch-pipeline",
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    // TODO: change to prod at some point
    basePath: "http://localhost:3000/api/v1",
    pineconeConfig: {
      apiKey: process.env.PINECONE_API_KEY ?? "",
      environment: process.env.PINECONE_ENVIRONMENT ?? "",
    },
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const pinecone = await runner.getPinecone();

  const index = await pinecone.Index("openai-trec");

  const queryResponse = await index.query({
    queryRequest: {
      vector: DEFAULT_VECTOR,
      topK: 3,
      includeValues: true,
    },
  });

  console.log("queryResponse", queryResponse);

  await runner.submit();
}

queryPineconeIndex();
