import { init, Pipeline, runTest, runTestWithDataset } from "@gentrace/core";

const PIPELINE_SLUG = "copilot";
const DATASET_ID = "7d381a8c-6e42-4751-ac8d-c2749e057048";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
  resultName: "Vivek's Result Name",
});

const pipeline = new Pipeline({
  slug: PIPELINE_SLUG,
});

async function submitTestRun() {
  try {
    await runTestWithDataset(PIPELINE_SLUG, DATASET_ID, async (testCase) => {
      console.log("Test Case:", testCase);
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
