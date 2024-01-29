import { getTestCases, init, submitTestResult } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Another one",
});

const PIPELINE_SLUG = "guess-the-year";

async function testFailure() {
  const cases = await getTestCases(PIPELINE_SLUG);

  const response = await submitTestResult(
    PIPELINE_SLUG,
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
