import { init, Pipeline, runTest } from "@gentrace/node";

const PIPELINE_SLUG = "testing-pipeline-id";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
  runName: "Vivek's Run Name",
});

const pipeline = new Pipeline({
  slug: PIPELINE_SLUG,
  openAIConfig: {
    apiKey: process.env.OPENAI_KEY,
  },
});

async function submitTestRun() {
  try {
    await runTest(PIPELINE_SLUG, async (testCase) => {
      const runner = pipeline.start();

      const outputs = await runner.measure(
        (inputs) => {
          console.log("inputs", inputs);
          // Simply return inputs as outputs
          return inputs;
        },
        [testCase.inputs]
      );

      await runner.submit();

      return [outputs, runner];
    });
  } catch (e) {
    console.error("Error value", e);
  }
}

submitTestRun();
