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
    prompt: "This is a test.",
  });

  console.log("completion response", completionResponse);
}

createCompletion();
