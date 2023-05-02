import { OpenAIApi, Configuration } from "@gentrace/node/openai";

const openai = new OpenAIApi(
  new Configuration({
    gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
    gentraceBasePath: "http://localhost:3000/api/v1",
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createCompletion() {
  const chatCompletionResponse = await openai.createChatCompletion({
    messages: [
      {
        role: "user",
        contentTemplate: "Hello {{ name }}!",
        contentInputs: { name: "Vivek" },
      },
    ],
    model: "gpt-3.5-turbo",
    pipelineId: "testing-pipeline-id",
  });

  console.log(" chat completion response", chatCompletionResponse);
}

createCompletion();
