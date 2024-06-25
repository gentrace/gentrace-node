import {
  getTestCases,
  init,
  submitTestResult,
  updateTestResult,
} from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Another one",
  basePath: "http://localhost:3000/api",
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

  const updateResponse = await updateTestResult(
    response.resultId,
    [cases[1]],
    [
      {
        value: "something",
      },
    ],
  );

  console.log("response", response);

  console.log("update response", updateResponse);
}

testFailure();
