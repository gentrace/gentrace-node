import { init, getTestCases, submitTestResult } from "@gentrace/node";

const SET_ID = "9685b34e-2cac-5bd2-8751-c9e34ff9fd98";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
    runName: "Vivek's Run Name",
  });

  const testCases = await getTestCases(SET_ID);

  const outputs = testCases.map(
    (testCase) => testCase.expectedOutputs ?? { value: "" }
  );

  try {
    const submissionResponse = await submitTestResult(
      SET_ID,
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
