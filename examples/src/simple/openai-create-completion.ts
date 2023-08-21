import { init } from "@gentrace/node";
import { OpenAIApi } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_KEY,
});

async function createCompletion() {
  const completionResponse = await openai.completions.create({
    pipelineSlug: "testing-pipeline-id",
    model: "text-davinci-003",
    promptTemplate: "Write a brief summary of the history of {{ company }}: ",
    promptInputs: {
      company: "Google",
    },
    stream: true,
  });

  for await (const message of completionResponse) {
    console.log("Message", message.choices[0]);
  }

  console.log("PRI", completionResponse.pipelineRunId);
}

createCompletion();
