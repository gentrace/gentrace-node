import { init, Pipeline, runTest } from "@gentrace/node";
import { Configuration } from "@gentrace/node/openai";

const PIPELINE_SLUG = "example-pipeline";

const pipeline = new Pipeline({
  id: "completion-pipeline",
  openAIConfig: new Configuration({
    apiKey: process.env.OPENAI_KEY,
  }),
});

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
    runName: "Vivek's Run Name",
  });

  await runTest(PIPELINE_SLUG, async (testCase) => {
    const runner = pipeline.start();

    const openAi = await runner.getOpenAI();

    await openAi.createCompletion({
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: testCase.inputs,
    });

    await runner.submit();
  });
}

submitTestRun();
