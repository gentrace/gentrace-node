import { init } from "@gentrace/node";
import { PineconeClient } from "@gentrace/node/pinecone";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const pinecone = new PineconeClient();

async function fetchPineconeIndex() {
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const index = await pinecone.Index("openai-trec");

  const fetchResponse = await index.fetch({
    pipelineId: "pinecone-fetch-self-contained-5",
    ids: ["3890"],
  });

  console.log("fetchResponse", fetchResponse);
}

fetchPineconeIndex();
