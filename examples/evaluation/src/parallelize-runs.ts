import {
  init,
  Pipeline,
  PipelineRunTestCaseTuple,
  getTestRunners,
  submitTestRunners,
  updateTestResultWithRunners,
} from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";

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
      console.log("item", item);
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

  const plugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  // get the existing pipeline (if already exists)
  const pipelineBySlug = new Pipeline({
    slug: PIPELINE_SLUG,
    plugins: {
      openai: plugin,
    },
  });

  const pipeline = pipelineBySlug;

  const exampleHandler = async ([
    runner,
    testCase,
  ]: PipelineRunTestCaseTuple) => {
    console.log("Before this");
    // @ts-ignore
    const completion = await runner.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Convert this sentence to JSON: John is 10 years old.",
        },
      ],
      gentrace: {
        metadata: {
          promptOne: {
            type: "string",
            value: "Hello!",
          },
          promptTwo: {
            type: "string",
            value: "Hello!",
          },
        },
      },
    });

    console.log("completion", completion);

    return completion;
  };

  const pipelineRunTestCases = await getTestRunners(pipeline);

  const infos = await enableParallelism(pipelineRunTestCases, exampleHandler, {
    parallelThreads: 5,
  });

  console.log("about to submit", infos);

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
}

main();