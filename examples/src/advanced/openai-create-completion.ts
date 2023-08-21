import { init, Pipeline } from "@gentrace/node";

async function createCompletion() {
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

  const completionResponse = await openAi.completions.create({
    model: "text-davinci-003",
    promptTemplate: "Write a brief summary of the history of {{ company }}: ",
    promptInputs: {
      company: "Google",
    },
    stream: true,
  });

  console.log("Completion response: ", completionResponse);

  await runner.submit();
}

createCompletion();
