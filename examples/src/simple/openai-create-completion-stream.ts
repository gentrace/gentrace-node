import { init } from "@gentrace/node";
import { OpenAIApi } from "@gentrace/node/openai";
import { Completion } from "openai/resources";
import { Stream } from "openai/streaming";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_KEY,
});

async function createCompletion() {
  const completionResponse = (await openai.completions.create({
    pipelineSlug: "testing-pipeline-id",
    model: "text-davinci-003",
    promptTemplate:
      "Write a 500 word summary of the history of {{ company }}. Make it long: ",
    promptInputs: {
      company: "Google",
    },
    stream: true,
  })) as Stream<Completion>;

  for await (const part of completionResponse) {
    console.log(part.choices[0]?.text || "");
  }
}

createCompletion();
