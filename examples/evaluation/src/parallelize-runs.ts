import {
  init,
  Pipeline,
  PipelineRunTestCaseTuple,
  getTestRunners,
  submitTestRunners,
} from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";

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
    // @ts-ignore
    const completion = await runner.openai.chat.completions.create({
      model: "gpt-4o",
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

    return completion;
  };

  const pipelineRunTestCases = await getTestRunners(pipeline);

  const infos = await enableParallelism(pipelineRunTestCases, exampleHandler, {
    parallelThreads: 5,
  });

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log("[PARALLEL-RUN] Response from submitTestRunners:", response);
}

main();
