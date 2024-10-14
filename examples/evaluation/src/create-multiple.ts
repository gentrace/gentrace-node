import { createTestCases, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function createMultiple() {
  const creationCount = await createTestCases({
    pipelineSlug: "guess-the-year",
    testCases: Array.from({ length: 10 }, (_, index) => ({
      name: `TC ${index + 1}`,
      inputs: {
        [["x", "y", "z"][Math.floor(Math.random() * 3)]]: Math.floor(
          Math.random() * 100,
        ),
        [["p", "q", "r"][Math.floor(Math.random() * 3)]]: Math.floor(
          Math.random() * 100,
        ),
      },
      expectedOutputs: {
        [["m", "n", "o"][Math.floor(Math.random() * 3)]]: Math.floor(
          Math.random() * 100,
        ),
      },
    })),
  });

  console.log("Creation count", creationCount);
}

createMultiple();
