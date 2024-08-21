import { createTestCases, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function createMultiple() {
  const creationCount = await createTestCases({
    pipelineSlug: "guess-the-year",
    testCases: [
      {
        name: `TC ${Math.random()}`,
        inputs: { a: 1, b: 2 },
        expectedOutputs: { c: 3 },
      },
    ],
  });

  console.log("Creation count", creationCount);
}

createMultiple();
