import { initPlugin } from "@gentrace/openai";
import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
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

  const runner = pipeline.start();

  const openai = runner.openai;

  const moderationResponse = await openai.moderations.create({
    model: "text-moderation-latest",
    input: "Testing sample information",
  });

  console.log("Moderation response", moderationResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
