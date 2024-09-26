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
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      pinecone: plugin,
    },
  });

  const INDEX_NAME = "example-index-2";

  const runner = pipeline.start();

  const pinecone = await runner.pinecone;

  const index = await pinecone.index(INDEX_NAME);

  try {
    const response = await index.fetch(["8248"]);

    const movieRecord = response.records["8248"];

    if (movieRecord && movieRecord.metadata) {
      console.log(movieRecord.metadata);
    }
  } catch (e) {
    return;
  }

  const result = await runner.submit();

  console.log("result", result);
}

createChatCompletion();
