import { init, runTest, Pipeline, Configuration } from "@gentrace/node";

const PIPELINE_SLUG = "example-pipeline";

const pipeline = new Pipeline({
  id: PIPELINE_SLUG,
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

    await runner.measure(
      (inputs) => {
        // Simply return inputs as outputs
        return inputs;
      },
      [testCase.inputs]
    );

    return runner;
  });
}

submitTestRun();
