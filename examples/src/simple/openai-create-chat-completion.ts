import { init } from "@gentrace/node";
import { OpenAIApi } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_KEY,
});

async function createCompletion() {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        contentTemplate: "Hello {{ name }}! Write a 1000 word summary",
        contentInputs: { name: "Vivek" },
      },
    ],
    model: "gpt-3.5-turbo",
    pipelineSlug: "testing-pipeline-id",
  });

  console.log("PRI", response.pipelineRunId);

  for await (const message of response) {
    console.log("Message", message.choices[0]);
  }
}

createCompletion();
