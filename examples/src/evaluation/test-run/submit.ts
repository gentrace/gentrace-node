import { init, getTestCases, submitTestResults } from "@gentrace/node";

const SET_ID = "0a82a2ee-e11d-4130-b6b5-7f84b1d75471";

async function submitTestRun() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const testCases = await getTestCases(SET_ID);

  const outputs: string[] = testCases.map(
    (testCase) => testCase.expected ?? ""
  );

  const submissionResponse = await submitTestResults(
    SET_ID,
    testCases,
    outputs
  );

  const runId = submissionResponse.runId;

  console.log("runId: ", runId);
}

submitTestRun();
