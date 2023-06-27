import { init, getTestCases, submitTestResults } from "@gentrace/node";

const SET_ID = "9685b34e-2cac-5bd2-8751-c9e34ff9fd98";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
    runName: "Vivek's Run Name",
  });

  const testCases = await getTestCases(SET_ID);

  const outputSteps: { key: string; output: string }[][] = testCases.map(
    (testCase) => {
      return [
        {
          key: "compose",
          output: testCase.expected ?? "",
        },
      ];
    }
  );

  const outputs: string[] = testCases.map(
    (testCase) => testCase.expected ?? ""
  );

  try {
    const submissionResponse = await submitTestResults(
      SET_ID,
      testCases,
      outputs,
      outputSteps
    );

    const runId = submissionResponse.runId;
    console.log("runId: ", runId);
  } catch (e) {
    console.log("Error submitting test run: ", e, JSON.stringify(e));
    return;
  }
}

submitTestRun();
