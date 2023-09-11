import { init, Pipeline } from "@gentrace/core";
import { initPlugin } from "@gentrace/pinecone";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const plugin = await initPlugin({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      pinecone: plugin,
    },
  });

  const runner = pipeline.start();

  const pinecone = await runner.pinecone;

  const index = await pinecone.index("openai-trec");

  try {
    const response = await index.deleteOne("8248");

    console.log("deletion response", response);
  } catch (e) {
    console.log("error", e);
    return;
  }

  await runner.submit();
}

createChatCompletion();
