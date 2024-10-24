import { createTestCase, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function createSingle() {
  const caseId = await createTestCase({
    pipelineSlug: "guess-the-year",
    name: `TC ${Math.random()}`,
    inputs: { a: 1, b: 2 },
    expectedOutputs: [{ c: 3 }],
  });

  console.log("Case ID", caseId);
}

createSingle();
