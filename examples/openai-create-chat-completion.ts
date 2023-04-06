import { Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function createChatCompletion() {
  const pipeline = new Pipeline({
    id: "create-completion-pipeline",
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    // TODO: change to prod at some point
    basePath: "http://localhost:3000/api/v1",
    openAIConfig: new Configuration({
      apiKey: process.env.OPENAI_KEY,
    }),
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.getOpenAI();

  const chatCompletionResponse = await openAi.createChatCompletion({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("OpenAI chat completion response", chatCompletionResponse);

  await runner.submit();
}

createChatCompletion();
