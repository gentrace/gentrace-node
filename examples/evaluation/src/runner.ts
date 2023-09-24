import { init, Pipeline, runTest } from "@gentrace/core";

const PIPELINE_SLUG = "testing-html";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
  runName: "Vivek's Run Name",
});

const pipeline = new Pipeline({
  slug: PIPELINE_SLUG,
});

async function submitTestRun() {
  try {
    await runTest(PIPELINE_SLUG, async (testCase) => {
      const runner = pipeline.start();

      const outputs = await runner.measure(
        (inputs) => {
          console.log("inputs", inputs);
          // Simply return inputs as outputs
          return {
            example:
              "<h1>Example</h1><div>This is an <strong>example</strong></div>",
          };
        },
        [testCase.inputs],
        {
          context: {
            render: {
              type: "html",
              key: "example",
            },
          },
        },
      );

      await runner.submit();

      return [outputs, runner];
    });
  } catch (e) {
    console.error("Error value", e);
  }
}

submitTestRun();