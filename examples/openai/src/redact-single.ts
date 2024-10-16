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

  const completion = await runner.openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "user",
        content: "Convert this sentence to JSON: John is 10 years old.",
      },
    ],
    stream: true,
  });

  for await (const message of completion) {
    console.log(message);
  }

  const jsonObject = runner.toObject();

  const redactedObject = await PipelineRun.submitFromJson(jsonObject, {
    waitForServer: true,
    selectFields: {
      inputs: true,
      outputs: true,
      modelParams: false,
    },
  });

  console.log("Redacted", redactedObject);
}
createCompletion();
