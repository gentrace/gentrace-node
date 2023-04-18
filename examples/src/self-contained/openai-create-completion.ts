import { openai as openaiBuilder } from "@gentrace/node/openai";
import { Configuration } from "openai";

const openai = openaiBuilder({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }),
});

async function createCompletion() {
  const completionResponse = await openai.createCompletion({
    pipelineId: "testing-pipeline-id",
    model: "text-davinci-003",
    promptTemplate: "Write a brief summary of the history of {{ company }}: ",
    promptInputs: {
      company: "Google",
    },
  });

  console.log("completion response", completionResponse);
}

createCompletion();
