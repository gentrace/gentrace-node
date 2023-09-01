import { init } from "@gentrace/core";
import { OpenAIApi } from "@gentrace/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

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
    gentrace: {
      userId: "123",
    },
    stream: true,
  });

  for await (const message of response) {
    console.log("Message", message);
  }

  console.log("Data", response);
}

createCompletion();
