import { init, getTestCases, submitTestResult } from "@gentrace/node";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
    runName: "Vivek's Run Name",
  });

  const testCases = await getTestCases("main");

  const outputs = testCases.map(
    (testCase) => testCase.expectedOutputs ?? { value: "" }
  );

  try {
    const submissionResponse = await submitTestResult(
      "main",
      testCases,
      outputs
    );

    const runId = submissionResponse.runId;
    console.log("runId: ", runId);
  } catch (e) {
    console.log("Error submitting test run: ", e, JSON.stringify(e));
    return;
  }
}

submitTestRun();
