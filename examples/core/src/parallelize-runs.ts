import {
  init,
  Pipeline,
  PipelineRun,
  getTestRunners,
  submitTestRunners,
  TestCase,
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

  // get the existing pipeline by the slug (if already exists)
  const pipeline = new Pipeline({
    slug: PIPELINE_SLUG,
    plugins: {
      openai: openaiPlugin,
    },
  });

  // example handler
  const handler = async (runner: PipelineRun, testCase: TestCase) => {
    await runner.measure(
      (inputs) => {
        return {
          example: exampleResponse(inputs),
        };
      },
      [testCase.inputs],
    );
  };

  const pipelineRunTestCases = await getTestRunners(pipeline);

  for (const [pipelineRun, testCase] of pipelineRunTestCases) {
    await handler(pipelineRun, testCase); // TODO: add some parallelization to this example
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log(response);
}

main();
