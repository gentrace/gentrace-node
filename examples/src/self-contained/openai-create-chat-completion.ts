import { openai } from "@gentrace/node/openai";
import { Configuration } from "openai";

openai({
  gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
  gentraceBasePath: "http://localhost:3000/api/v1",
  config: new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }),
}).then((openai) => {
  async function createCompletion() {
    const chatCompletionResponse = await openai.createChatCompletion({
      messages: [{ role: "user", content: "Hello!" }],
      model: "gpt-3.5-turbo",
      pipelineId: "testing-pipeline-id",
    });

    console.log("chat completion response", chatCompletionResponse);
  }

  createCompletion();
});
