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
    if (Math.random() < 0.5) {
      runner.addEval({
        name: "example-eval",
        value: 1,
        label: "example-label",
        debug: {
          resolvedPrompt: "example-resolved-prompt",
          response: "example-response",
          finalClassification: "example-final-classification",
          processorLogs: [],
          logs: [["testing"]],
        },
      });
    }

    if (Math.random() < 0.5) {
      runner.addEval({
        name: "example-eval",
        value: 0.5,
        label: "example-label-another",
        debug: {
          resolvedPrompt: "example-resolved-prompt",
          response: "example-response",
          finalClassification: "example-final-classification",
          processorLogs: [],
          logs: [["testing"]],
        },
      });
    }

    if (Math.random() < 0.5) {
      runner.addEval({
        name: "example-eval",
        value: 0.1,
        label: "example-label-another",
        debug: {
          resolvedPrompt: "example-resolved-prompt",
          response: "example-response",
          finalClassification: "example-final-classification",
          processorLogs: [],
          logs: [["testing"]],
        },
      });
    }

    if (Math.random() < 0.5) {
      runner.addEval({
        name: "example-eval",
        value: 0.6,
        debug: {
          resolvedPrompt: "example-resolved-prompt-2",
          response: "example-response-2",
          finalClassification: "example-final-classification-2",
          processorLogs: [],
          logs: [["testing"]],
        },
      });
    }

    runner.addEval({
      name: "example-eval-2",
      value: 0.6,
      debug: {
        resolvedPrompt: "example-resolved-prompt-2",
        response: "example-response-2",
        finalClassification: "example-final-classification-2",
        processorLogs: [],
        logs: [["testing"]],
      },
    });

    runner.addEval({
      name: "example-eval-6",
      value: 0.6,
      debug: {
        resolvedPrompt: "example-resolved-prompt-2",
        response: "example-response-2",
        finalClassification: "example-final-classification-2",
        processorLogs: [],
        logs: [["testing"]],
      },
    });

    runner.addEval({
      name: "example-eval",
      value: 0.6,
      debug: {
        resolvedPrompt: "example-resolved-prompt-2",
        response: "example-response-2",
        finalClassification: "example-final-classification-2",
        processorLogs: [],
        logs: [["testing"]],
      },
    });
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log("[PARALLEL-RUN] Response from submitTestRunners:", response);
}

main();
