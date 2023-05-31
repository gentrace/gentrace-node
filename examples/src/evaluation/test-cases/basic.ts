import { Evaluation } from "@gentrace/node";

const SET_ID = "12494e89-af19-4326-a12c-54e487337ecc";

async function getTestCases() {
  const evaluation = new Evaluation({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const responses = await evaluation.getTestCases(SET_ID);

  for (const testCase of responses.testCases ?? []) {
    console.log("case: ", testCase);
  }
}

getTestCases();
