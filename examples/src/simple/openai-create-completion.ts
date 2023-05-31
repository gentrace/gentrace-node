import { OpenAIApi, Configuration } from "@gentrace/node/openai";

const openai = new OpenAIApi(
  new Configuration({
    gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
    gentraceBasePath: "http://localhost:3000/api/v1",
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createCompletion() {
  const completionResponse = await openai.createCompletion({
    pipelineId: "testing-pipeline-id",
    model: "text-davinci-003",
    promptTemplate: "Write a brief summary of the history of {{ company }}: ",
    promptInputs: {
      company: "Google",
    },
  });

  console.log("completion response", completionResponse.data.choices[0]);
}

createCompletion();
