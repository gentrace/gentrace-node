import { OpenAIApi, Configuration } from "@gentrace/openai-v3";
import { init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const openai = new OpenAIApi(
  new Configuration({
    gentraceLogger: {
      info: (message: any) => console.log(message),
      warn: (message: any) => console.warn(message),
    },
    apiKey: process.env.OPENAI_KEY,
  }),
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
    pipelineSlug: "testing-pipeline-id",
  });

  console.log("chat completion response", chatCompletionResponse);
}

createCompletion();
