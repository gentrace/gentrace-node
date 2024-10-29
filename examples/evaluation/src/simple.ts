import { getTestCases, init, submitTestResult } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Another one",
});

const PIPELINE_SLUG = "guess-the-year";

async function testFailure() {
  const cases = await getTestCases(PIPELINE_SLUG);

  const samePayload = {
    value: "This is a short string",
    object: {
      nested: "This is a nested string",
    },
  };

  const response = await submitTestResult(
    PIPELINE_SLUG,
    cases,
    cases.map((c, i) => ({
      ...samePayload,
    })),
    {
      metadata: {
        "test-run": {
          type: "string",
          value: "Some string value",
        },
      },
    },
  );
}

testFailure();
