import {
  init,
  Pipeline,
  PipelineRunTestCaseTuple,
  getTestRunners,
  submitTestRunners,
} from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";
import { evals } from "@gentrace/evals";

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

    return completion;
  };

  const pipelineRunTestCases = await getTestRunners(pipeline);

  console.log(
    "[ADD-LOCAL-EVALS] Number of test cases:",
    pipelineRunTestCases.length,
  );

  for (const pipelineRunTestCase of pipelineRunTestCases) {
    const runner = pipelineRunTestCase[0];
    const testCase = pipelineRunTestCase[1];

    await exampleHandler([runner, testCase]);

    try {
      const evalResult = await evals.llm.base({
        name: "Content Quality Evaluation",
        prompt: `Evaluate the following text for its quality and coherence:

"Artificial intelligence (AI) is revolutionizing various industries, from healthcare to finance. Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. Natural language processing enables computers to understand and generate human-like text. As AI continues to advance, it raises important ethical considerations and discussions about its impact on society and the workforce."

Please provide a score and reasoning for your evaluation. Consider factors such as clarity, coherence, and informativeness. Rate the text as one of the following: Poor, Fair, Good, or Excellent.`,
        scoreAs: {
          Poor: 0,
          Fair: 0.33,
          Good: 0.67,
          Excellent: 1,
        },
      });

      runner.addEval(evalResult);
    } catch (error) {
      console.error("Error running evaluation:", error);
    }
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log("[PARALLEL-RUN] Response from submitTestRunners:", response);
}

main();
