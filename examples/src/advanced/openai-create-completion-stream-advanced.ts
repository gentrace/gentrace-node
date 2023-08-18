import { init, Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function createCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const pipeline = new Pipeline({
    slug: "completion-pipeline",
    openAIConfig: new Configuration({
      apiKey: process.env.OPENAI_KEY,
    }),
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.getOpenAI();

  const completionResponse = await openAi.createCompletion(
    {
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: {
        company: "Google",
      },
      stream: true,
    },
    { responseType: "stream" }
  );

  // @ts-ignore
  completionResponse.data.on("data", (data) => {
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
        // console.log("vivek", parsed.choices[0]);
      } catch (error) {
        console.error("Could not JSON parse stream message", message, error);
      }
    }
  });

  await sleep(3);

  console.log("Completion response: ", completionResponse);

  await runner.submit();
}

createCompletion();
