import { init, Pipeline } from "@gentrace/node";
import { DEFAULT_VECTOR } from "../utils";

async function queryPineconeIndex() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });
  const pipeline = new Pipeline({
    id: "pinecone-index-fetch-pipeline",
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
