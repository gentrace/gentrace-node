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
  });

  const PIPELINE_SLUG = "testing-pipeline-id";

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
    const input = testCase.inputs as {
      sender: string;
      receiver: string;
      query: string;
    };

    // @ts-ignore
    const completion = await runner.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant helping to facilitate communication between two people.",
        },
        {
          role: "user",
          content: `Sender: ${input.sender}\nReceiver: ${input.receiver}\nQuery: ${input.query}\n\nPlease provide a polite and helpful response to the query, addressing the receiver.`,
        },
      ],
      gentrace: {
        metadata: {
          sender: {
            type: "string",
            value: input.sender,
          },
          receiver: {
            type: "string",
            value: input.receiver,
          },
          query: {
            type: "string",
            value: input.query,
          },
        },
      },
    });

    return completion;
  };

  const pipelineRunTestCases = await getTestRunners(
    pipeline,
    "a4eb18dc-8738-4056-a363-ab57845c5ec9",
  );

  console.log(
    "[ADD-LOCAL-EVALS] Number of test cases:",
    pipelineRunTestCases.length,
  );

  for (const pipelineRunTestCase of pipelineRunTestCases) {
    const runner = pipelineRunTestCase[0];
    const testCase = pipelineRunTestCase[1];

    const result = await exampleHandler([runner, testCase]);

    try {
      const evalResult = await evals.llm.base({
        name: "Response Quality Evaluation",
        prompt: `Evaluate the following AI-generated response for its quality, appropriateness, and helpfulness:

Input:
Sender: ${(testCase.inputs as any).sender}
Receiver: ${(testCase.inputs as any).receiver}
Query: ${(testCase.inputs as any).query}

AI Response:
${result.choices[0].message.content}

Please provide a score and reasoning for your evaluation. Consider factors such as:
1. Politeness and appropriate addressing of the receiver
2. Relevance to the query
3. Clarity and coherence of the response
4. Helpfulness of the information provided

Rate the response as one of the following: Poor, Fair, Good, or Excellent.`,
        scoreAs: {
          Poor: 0,
          Fair: 0.33,
          Good: 0.67,
          Excellent: 1,
        },
      });

      runner.addEval(evalResult);

      const responseContent = result.choices[0]?.message?.content || "";
      const wordCount = responseContent.split(/\s+/).length;

      // Bell curve scoring function to evaluate if the response has an appropriate length
      // Penalizes responses that are too short or too long, with the ideal length around 50 words
      const calculateScore = (count: number) => {
        const mean = 100;
        const stdDev = 20;
        const maxScore = 1;

        const zScore = Math.abs(count - mean) / stdDev;
        return Math.max(0, maxScore * Math.exp(-0.5 * Math.pow(zScore, 2)));
      };

      console.log("[WORD-COUNT] Word count and length score:", {
        wordCount,
        lengthScore: calculateScore(wordCount),
      });

      const lengthScore = calculateScore(wordCount);

      runner.addEval({
        name: "response-length-score",
        value: lengthScore,
      });
    } catch (error) {
      console.error("Error running evaluation:", error);
    }
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases, {
    triggerRemoteEvals: true,
  });
  console.log("[PARALLEL-RUN] Response from submitTestRunners:", response);
}

main();
