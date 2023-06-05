import { init, Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    id: "create-completion-pipeline",
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

  console.log("chatCompletionResponse", chatCompletionResponse.data);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
