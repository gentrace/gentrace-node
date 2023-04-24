import { Pipeline } from "@gentrace/node";
import { Configuration } from "openai";

async function createCompletion() {
  const pipeline = new Pipeline({
    id: "completion-pipeline",
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

  const completionResponse = await openAi.createCompletion({
    model: "text-davinci-003",
    promptTemplate: "Write a brief summary of the history of {{ company }}: ",
    promptInputs: {
      company: "Google",
    },
  });

  console.log("Completion response: ", completionResponse);

  await runner.submit();
}

createCompletion();
