import { init, getTestCases, submitTestResults } from "@gentrace/node";

const SET_ID = "77a43959-cbbb-42ef-8707-da3a6dfbaec0";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const testCases = await getTestCases(SET_ID);

  const outputs: string[] = testCases.map(
    (testCase) => "I hate you" // testCase.expected ?? ""
  );

  console.log("outputs: ", outputs, testCases);

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
