import * as Gentrace from "@gentrace/node";

async function fetchPineconeIndex() {
  const pipeline = new Gentrace.Pipeline({
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

  const fetchResponse = await index.fetch({
    ids: ["3890"],
  });

  console.log("fetchResponse", fetchResponse);

  await runner.submit();
}

fetchPineconeIndex();
