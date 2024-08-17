import { getTestCases, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function full() {
  const testCases = await getTestCases({
    pipelineId: "dfa76a77-5f9e-5e2d-bfd0-f5158585bc32",
  });

  console.log("test cases", testCases);

  const testCaseCount = testCases.length;
  console.log("Number of test cases:", testCaseCount);
}

full();
