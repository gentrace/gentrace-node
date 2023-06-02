import * as Gentrace from "@gentrace/node";

init({});

const SET_ID = "09c6528e-5a2b-548b-b666-c0cb71e12145";

async function submitTestRun() {
  const evaluation = new Gentrace.Evaluation({
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
    // results.push({
    //   caseId: testCase["id"],
    //   inputs: {
    //     a: "1",
    //     b: "2",
    //   },
    // });
  }

  const submissionResponse = await evaluation.submitTestResults(
    SET_ID,
    "source name",
    results
  );

  const runId = submissionResponse.runId;

  console.log("runId: ", runId);
}

submitTestRun();
