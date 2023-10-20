import { init, Pipeline } from "@gentrace/core";
import { Configuration, initPlugin } from "@gentrace/openai-v3";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  const plugin = await initPlugin(
    new Configuration({
      apiKey: process.env.OPENAI_KEY,
    }),
  );

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start();

  const openai = runner.openai;

  const chatCompletionResponse = await openai.createChatCompletion({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse.data);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
