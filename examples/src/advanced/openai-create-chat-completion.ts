import { init, Pipeline } from "@gentrace/node";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    openAIConfig: {
      apiKey: process.env.OPENAI_KEY,
    },
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.getOpenAI();

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
