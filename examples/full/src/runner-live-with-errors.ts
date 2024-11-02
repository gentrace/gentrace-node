import { init, Pipeline, runTest } from "@gentrace/core";

const PIPELINE_SLUG = "monkies";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  resultName: "Vivek's Result Name",
  basePath: process.env.GENTRACE_BASE_PATH,
});

const pipeline = new Pipeline({
  slug: PIPELINE_SLUG,
});

async function submitTestRun() {
  const runner = pipeline.start();

  try {
    const outputs = await runner.measure(
      (inputs) => {
        console.log("inputs", inputs);
        if (Math.random() > 0.5) {
          throw new Error("This is an error");
        }
        // Simply return inputs as outputs
        return {
          example:
            "<h1>Example</h1><div>This is an <strong>example</strong></div>",
        };
      },
      [{ hello: "world" }],
      {
        context: {
          render: {
            type: "html",
            key: "example",
          },
        },
      },
    );
  } catch (e) {
    runner.setError(e.toString());
    console.error("Error value", e);
  } finally {
    await runner.submit();
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const main = async () => {
  for (let i = 0; i < 100; i++) {
    await submitTestRun();
    await sleep(1000 * (Math.random() + 1));
  }
};

main();
