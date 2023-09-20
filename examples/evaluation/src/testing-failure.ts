import { getTestCases, init, submitTestResult } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
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
  );

  console.log("response", response);
}

testFailure();
