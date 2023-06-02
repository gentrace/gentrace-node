import { init, Pipeline } from "@gentrace/node";

async function deletePineconeIndex() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    id: "pinecone-index-delete-pipeline",
    pineconeConfig: {
      apiKey: process.env.PINECONE_API_KEY ?? "",
      environment: process.env.PINECONE_ENVIRONMENT ?? "",
    },
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const pinecone = await runner.getPinecone();

  const index = await pinecone.Index("openai-trec");

  const deleteResponse = await index.delete1({
    ids: ["3890"],
  });
  console.log("deleteResponse", deleteResponse);

  const runnerResponse = await runner.submit();
  console.log("runnerResponse", runnerResponse);
}

deletePineconeIndex();
