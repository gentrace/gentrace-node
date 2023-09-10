import { initPlugin as initOpenAIPlugin } from "@gentrace/openai";
import { initPlugin as initPineconePlugin } from "@gentrace/pinecone";
import { init, Pipeline } from "@gentrace/core";
import { DEFAULT_VECTOR } from "./utils";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function full() {
  const openaiPlugin = await initOpenAIPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  const pineconePlugin = await initPineconePlugin({
    apiKey: process.env.PINECONE_API_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      openai: openaiPlugin,
      pinecone: pineconePlugin,
    },
  });

  const runner = pipeline.start();

  const pinecone = runner.pinecone;

  const openai = runner.openai;

  const chatCompletionResponse = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  const index = await pinecone.Index("openai-trec");

  const upsertResponse = await index.upsert([
    {
      id: String(Math.floor(Math.random() * 10000)),
      values: DEFAULT_VECTOR,
    },
  ]);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

full();
