import { init, Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    openAIConfig: new Configuration({
      apiKey: process.env.OPENAI_KEY,
    }),
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.getOpenAI();

  const chatCompletionResponse = await openAi.createChatCompletion(
    {
      messages: [
        { role: "user", content: "Hello, can you help me with coding?" },
      ],
      model: "gpt-3.5-turbo",
      stream: true,
    },
    { responseType: "stream" }
  );

  chatCompletionResponse.data.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim() !== "");
    for (const line of lines) {
      const message = line.replace(/^data: /, "");
      if (message === "[DONE]") {
        return; // Stream finished
      }
      try {
        const parsed = JSON.parse(message);
        console.log(parsed.choices[0]);
      } catch (error) {
        console.error("Could not JSON parse stream message", message, error);
      }
    }
  });

  await sleep(3);

  const pipelineRunId = await runner.submit({ waitForServer: true });

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
