import { initPlugin } from "@gentrace/openai";
import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const plugin = initPlugin({
  apiKey: process.env.OPENAI_KEY ?? "",
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
});

const pipeline = new Pipeline({
  slug: "testing-pipeline-id",
});

async function createChatCompletion() {
  const runner = pipeline.start();

  const openAi = runner.attach(plugin);

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
