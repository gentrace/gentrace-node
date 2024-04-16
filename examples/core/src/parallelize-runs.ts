import {
  init,
  Pipeline,
  getTestRunners,
  submitTestRunners,
} from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";

function exampleResponse(inputs: any) {
  return "This is a generated response from the AI";
}

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  const PIPELINE_SLUG = "guess-the-year";

  const openaiPlugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY,
  });

  const pipeline = new Pipeline({
    slug: PIPELINE_SLUG,
    plugins: {
      openai: openaiPlugin,
    },
  });

  // example handler
  const handler = async (testCase: any) => {
    const runner = pipeline.start();

    const outputs = await runner.measure(
      (inputs) => {
        return {
          example: exampleResponse(inputs),
        };
      },
      [testCase.inputs],
    );

    await runner.submit();

    // passing the runner back is very important
    return [outputs, runner];
  };

  const pipelineRunTestCases = await getTestRunners(pipeline);
  for (const [pipelineRun, testCase] of pipelineRunTestCases) {
    // TODO: set up the pipelineRun correctly
    const [, pipelineRun] = await handler(testCase);
  }

  // TODO: add some parallelization to this example

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log(response);
}

main();
