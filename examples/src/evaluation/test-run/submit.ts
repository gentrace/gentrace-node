import { init, runTest, Pipeline, Configuration } from "@gentrace/node";

const PIPELINE_SLUG = "guess-the-year";

const pipeline = new Pipeline({
  slug: PIPELINE_SLUG,
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

  try {
    await runTest(PIPELINE_SLUG, async (testCase) => {
      const runner = pipeline.start();

      await runner.measure(
        (inputs) => {
          console.log("inputs", inputs);
          // Simply return inputs as outputs
          return inputs;
        },
        [testCase.inputs]
      );

      return runner;
    });
  } catch (e) {
    console.error("Error value", e);
  }
}

submitTestRun();
