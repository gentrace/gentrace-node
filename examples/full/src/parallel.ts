import {
  init,
  Pipeline,
  PipelineRunTestCaseTuple,
  getTestRunners,
  submitTestRunners,
  updateTestResultWithRunners,
} from "@gentrace/core";

function exampleResponse(inputs: any) {
  return "This is a generated response from the AI";
}

// utility function to enable parallelism
export const enableParallelism = async <T, U>(
  items: T[],
  callbackFn: (t: T) => Promise<U>,
  { parallelThreads = 10 }: { parallelThreads?: number } = {},
) => {
  const results = Array<U>(items.length);

  const iterator = items.entries();
  const doAction = async (iterator: IterableIterator<[number, T]>) => {
    for (const [index, item] of iterator) {
      results[index] = await callbackFn(item);
    }
  };
  const workers = Array(parallelThreads).fill(iterator).map(doAction);
  await Promise.allSettled(workers);
  return results;
};

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api",
  });

  const PIPELINE_SLUG = "guess-the-year";

  // get the existing pipeline (if already exists)
  const pipelineBySlug = new Pipeline({
    slug: PIPELINE_SLUG,
  });

  // example pipeline by ID
  const pipelineById = new Pipeline({
    id: "c10408c7-abde-5c19-b339-e8b1087c9b64",
  });

  const pipeline = pipelineBySlug;

  const exampleHandler = async ([
    runner,
    testCase,
  ]: PipelineRunTestCaseTuple) => {
    await runner.measure(
      (inputs: any) => {
        return {
          example: exampleResponse(inputs),
        };
      },
      [testCase.inputs],
    );
  };

  const pipelineRunTestCases = await getTestRunners(
    pipeline,
    "70a96925-db53-5c59-82b4-f42e988950a9",
  );

  await enableParallelism(pipelineRunTestCases, exampleHandler, {
    parallelThreads: 5,
  });

  const response = await submitTestRunners(pipeline, [pipelineRunTestCases[0]]);

  const updateResponse = await updateTestResultWithRunners(
    response.resultId,
    pipelineRunTestCases.slice(2),
  );

  console.log("response", response);
  console.log("update response", updateResponse);
}

main();
