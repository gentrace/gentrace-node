import { init, Pipeline } from "@gentrace/core";
import { initPlugin } from "@gentrace/pinecone";

type MovieMetadata = {
  title: string;
  genre: string;
  runtime: number;
};

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
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

  const index = await pinecone.index<MovieMetadata>("openai-trec");

  try {
    const response = await index.fetch(["8248"]);

    const movieRecord = response.records["8248"];

    if (movieRecord && movieRecord.metadata) {
      console.log(movieRecord.metadata);
    }

    console.log("upsertResponse", response);
  } catch (e) {
    return;
  }

  await runner.submit();
}

createChatCompletion();
