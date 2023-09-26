import { initPlugin } from "@gentrace/openai";
import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function createChatCompletion() {
  const plugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start({
    userId: "first-user-id",
    metadata: {
      testing: {
        type: "url",
        url: "https://google.com",
        text: "Google",
      },
    },
  });

  const openai = runner.openai;

  const chatCompletionResponse = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    gentrace: {
      metadata: {
        promptOne: {
          type: "string",
          value: "Hello!",
        },
      },
    },
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    gentrace: {
      metadata: {
        promptTwo: {
          type: "string",
          value: "Another",
        },
      },
    },
  });

  console.log("Message", chatCompletionResponseTwo.choices[0].message);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
