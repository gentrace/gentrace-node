import { init } from "@gentrace/node";
import { OpenAIApi, Configuration } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_KEY,
  })
);

async function createCompletion() {
  const completionResponse = await openai.createCompletion({
    pipelineSlug: "testing-pipeline-id",
    model: "text-davinci-003",
    prompt: "This is a test.",
  });

  console.log("completion response", completionResponse);
}

createCompletion();
