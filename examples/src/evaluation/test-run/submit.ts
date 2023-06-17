import { init, getTestCases, submitTestResults } from "@gentrace/node";

const SET_ID = "e605d843-88e0-4462-85cc-2d49b0217a30";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    runName: "Vivek's Run Name",
  });

  const testCases = await getTestCases(SET_ID);

  const outputs: string[] = testCases.map(
    (testCase) => testCase.expected ?? ""
  );

  try {
    const submissionResponse = await submitTestResults(
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
