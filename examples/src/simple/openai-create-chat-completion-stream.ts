import { init } from "@gentrace/node";
import { OpenAIApi, Configuration } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi(
  new Configuration({
    gentraceLogger: {
      info: (message) => console.log(message),
      warn: (message) => console.warn(message),
    },
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createCompletion() {
  const chatCompletionResponse = await openai.createChatCompletion(
    {
      messages: [
        {
          role: "user",
          contentTemplate: "Hello {{ name }}!",
          contentInputs: { name: "Vivek" },
        },
      ],
      model: "gpt-3.5-turbo",
      pipelineSlug: "testing-pipeline-id",
      stream: true,
    },
    { responseType: "stream" }
  );
}

createCompletion();