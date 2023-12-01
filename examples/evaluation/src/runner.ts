import { init, Pipeline, runTest } from "@gentrace/core";

const PIPELINE_SLUG = "guess-the-year";

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
    await runTest(
      PIPELINE_SLUG,
      async (testCase) => {
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
      },
      (testCase) => {
        return testCase.id === "a2bddcbc-51ac-5831-be0d-5868a7ffa1db";
      },
    );
  } catch (e) {
    console.error("Error value", e);
  }
}

submitTestRun();
