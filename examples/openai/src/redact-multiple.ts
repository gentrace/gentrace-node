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

  const runner = pipeline.start();

  await runner.openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "user",
        content: "Convert this sentence to JSON: John is 10 years old.",
      },
      {
        role: "user",
        content: "Convert this sentence to JSON: John is 10 years old.",
      },
    ],
  });

  console.log("Done 1");

  await runner.openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "user",
        content: "Convert this sentence to JSON: John is 10 years old.",
      },
    ],
  });

  console.log("Done 2");

  const jsonObject = runner.toObject();

  const redactedObject = await PipelineRun.submitFromJson(jsonObject, {
    waitForServer: true,
    selectFields: (steps) => {
      return steps.map((step, index) => ({
        // inputs: true,
        // inputs: index === 0 ? ["messages[0].role", "messages[0].content"] : false,
        inputs:
          index === 0
            ? [
                ["messages", "0", "role"],
                ["messages", "0", "content"],
              ]
            : false,
        outputs: index === 1,
        modelParams: false,
      }));
    },
  });

  console.log("Done 3");

  console.log("Redacted", redactedObject);
}
createCompletion();
