import { getTestCases, init } from "@gentrace/node";

const SET_ID = "09c6528e-5a2b-548b-b666-c0cb71e12145";

async function testCases() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const responses = await getTestCases(SET_ID);

  for (const testCase of responses.testCases ?? []) {
    console.log("case: ", testCase);
  }
}

testCases();
