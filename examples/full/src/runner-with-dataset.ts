import { init, Pipeline, runTestWithDataset } from "@gentrace/core";

const PIPELINE_SLUG = "monkies";
const DATASET_ID = "191395b2-b34f-45f3-acd3-db6e39208bc3";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
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
