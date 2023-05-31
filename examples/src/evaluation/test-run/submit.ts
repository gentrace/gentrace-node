import { Evaluation } from "@gentrace/node";

const SET_ID = "12494e89-af19-4326-a12c-54e487337ecc";

async function submitTestRun() {
  const evaluation = new Evaluation({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const responses = await evaluation.getTestCases(SET_ID);

  const results: {
    caseId: string;
    inputs: Record<string, string>;
    output: string;
  }[] = [];
  for (const testCase of responses.testCases ?? []) {
    results.push({
      caseId: testCase["id"],
      inputs: {
        a: "1",
        b: "2",
      },
      output: "This are some outputs",
    });
  }

  const submissionResponse = await evaluation.submitTestResults(
    SET_ID,
    "test-run-id",
    results
  );

  const runId = submissionResponse.runId;

  console.log("runId: ", runId);
}

submitTestRun();
