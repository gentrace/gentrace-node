import {
  createTestRunners,
  init,
  LocalTestData,
  Pipeline,
  submitTestRunners,
} from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
  });

  const PIPELINE_SLUG = "guess-the-year";

  const plugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: PIPELINE_SLUG,
    plugins: {
      openai: plugin,
    },
  });

  // Create local test data
  const localData: LocalTestData[] = [
    {
      name: "Test Case 1",
      inputs: {
        prompt: "Convert this sentence to JSON: John is 10 years old.",
      },
    },
    {
      name: "Test Case 2",
      inputs: {
        prompt: "Convert this sentence to JSON: Alice is 25 years old.",
      },
    },
    // Add more test cases as needed
  ];

  // Create test runners using local data
  const pipelineRunTestCases = createTestRunners(pipeline, localData);

  console.log(
    "[CREATE-LOCAL-DATA] Number of test cases:",
    pipelineRunTestCases.length,
  );

  for (const [runner, testCase] of pipelineRunTestCases) {
    // @ts-ignore
    const completion = await runner.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: testCase.inputs.prompt,
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

    // // Add evaluations
    // if (Math.random() < 0.5) {
    //   runner.addEval({
    //     name: "example-eval",
    //     value: 1,
    //     label: "example-label",
    //     debug: {
    //       resolvedPrompt: "example-resolved-prompt",
    //       response: "example-response",
    //       finalClassification: "example-final-classification",
    //       processorLogs: [],
    //       logs: [["testing"]],
    //     },
    //   });
    // }

    // runner.addEval({
    //   name: "example-eval-2",
    //   value: 0.6,
    //   debug: {
    //     resolvedPrompt: "example-resolved-prompt-2",
    //     response: "example-response-2",
    //     finalClassification: "example-final-classification-2",
    //     processorLogs: [],
    //     logs: [["testing"]],
    //   },
    // });

    // Add more evaluations as needed
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log("[CREATE-LOCAL-DATA] Response from submitTestRunners:", response);
}

main();
