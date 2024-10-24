import {
  createTestRunners,
  init,
  LocalTestData,
  Pipeline,
  submitTestRunners,
} from "@gentrace/core";

const PIPELINE_SLUG = "guess-the-year";

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: PIPELINE_SLUG,
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
    // TODO: Add more test cases as needed
  ];

  const pipelineRunTestCases = createTestRunners(pipeline, localData);

  // A tuple is created for each test case in the array
  for (const [runner, testCase] of pipelineRunTestCases) {
    const outputs = await runner.measure(
      async (inputs) => {
        // FOR EACH TEST CASE, submit your custom data here
        return {
          result: "Hello, world!",
        };
      },
      [testCase.inputs],
    );
  }

  const response = await submitTestRunners(pipeline, pipelineRunTestCases);
  console.log(
    `Test result submitted successfully. Result ID: ${response.resultId}`,
  );

  // You can use this resultId for further operations if needed
  const resultId = response.resultId;

  console.log(`Result ID for future reference: ${resultId}`);
}

main();
