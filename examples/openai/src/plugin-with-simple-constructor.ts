import { initPlugin, OpenAIApi } from "@gentrace/openai";
import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function createChatCompletion() {
  const openaiSimple = new OpenAIApi({
    apiKey: process.env.OPENAI_KEY,
  });

  const plugin = await initPlugin(openaiSimple);

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start();

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

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
