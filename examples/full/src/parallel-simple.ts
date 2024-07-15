import {
  init,
  Pipeline,
  PipelineRunTestCaseTuple,
  getTestRunners,
  submitTestResult,
  getTestCase,
  getTestCases,
  updateTestResult,
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

  const cases = await getTestCases(PIPELINE_SLUG);

  const response = await submitTestResult(
    PIPELINE_SLUG,
    [cases[0]],
    [
      {
        value: "something",
        name: "John Doe",
        age: 30,
        city: "New York",
        occupation: "Software Developer",
        hobbies: ["reading", "coding", "traveling"],
      },
    ],
    {
      metadata: {
        "test-run": {
          type: "string",
          value: "Some string value",
        },
      },
    },
  );

  console.log("response", response);

  const resultId = response.resultId;

  const updateResponse = await updateTestResult(
    resultId,
    [cases[1]],
    [
      {
        value: "something",
      },
    ],
  );

  console.log("Updated test result with ID:", updateResponse.resultId);
}

main();
