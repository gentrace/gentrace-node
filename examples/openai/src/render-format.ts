import OpenAI, { initPlugin } from "@gentrace/openai";
import { init, Pipeline } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
});

async function createChatCompletion() {
  const openaiSimple = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });

  const plugin = await initPlugin(openaiSimple);

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start();

  const openai = runner.openai;

  const chatCompletionResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content:
          "Create a short blog post in W3C-compliant HTML. Do not return anything but valid HTML.",
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const htmlOutput = chatCompletionResponse.choices[0].message.content;

  await runner.measure(
    (htmlOutput) => {
      return {
        htmlOutput,
      };
    },
    [htmlOutput],
    {
      context: {
        render: {
          type: "html",
          key: "htmlOutput",
        },
      },
    },
  );

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
