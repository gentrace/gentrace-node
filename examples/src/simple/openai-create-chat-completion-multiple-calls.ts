import { init } from "@gentrace/node";
import { OpenAIApi } from "@gentrace/node/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const openai = new OpenAIApi({
  gentraceLogger: {
    info: (message) => console.log(message),
    warn: (message) => console.warn(message),
  },
  apiKey: process.env.OPENAI_KEY,
});

async function createCompletion() {
  const chatCompletionResponseOne = await openai.chat.completions.create({
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
  });

  console.log("PRI", chatCompletionResponseOne.pipelineRunId);

  for await (const chunk of chatCompletionResponseOne) {
    console.log("Chunk", chunk);
  }

  const chatCompletionResponseTwo = await openai.chat.completions.create({
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

  console.log("chatCompletionResponseTwo", chatCompletionResponseTwo);
}

createCompletion();
