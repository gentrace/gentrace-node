import { init, Pipeline, PipelineRun } from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function createCompletion() {
  const plugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: "testing-vivek-5",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start({
    userId: "user-id",
  });

  const completion = await runner.openai.chat.completions.create({
    stream: true,
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "user",
        content: "Convert this sentence to JSON: John is 10 years old.",
      },
    ],
    gentrace: {
      metadata: {
        "prompt-version vivek %LIKE%": {
          type: "string",
          value: "1.0.0",
        },
      },
    },
    tools: [
      {
        type: "function",
        function: {
          name: "person",
          description: "person_info",
          parameters: {
            type: "object",
            properties: {
              age: {
                type: "integer",
                description: "Age",
              },
            },
            required: ["age"],
          },
        },
      },
    ],
  });

  for await (const chunk of completion) {
    console.log(JSON.stringify(chunk, null, 2));
  }

  await runner.submit();
}
createCompletion();
