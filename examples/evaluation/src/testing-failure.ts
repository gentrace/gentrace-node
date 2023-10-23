import { getTestCases, init, submitTestResult } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Another one",
  basePath: "http://localhost:3000/api",
});

async function testFailure() {
  const cases = await getTestCases("monkies2");

  const response = await submitTestResult(
    "monkies2",
    [cases[0]],
    [
      {
        value: "something",
      },
    ],
    {
      metadata: {
        "test-run": {
          type: "string",
          value: "Some string value",
        },
      },
    },
  );

  console.log("response", response);
}

testFailure();
