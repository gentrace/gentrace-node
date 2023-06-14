import { getTestCases, init } from "@gentrace/node";

const SET_ID = "0a82a2ee-e11d-4130-b6b5-7f84b1d75471";

async function testCases() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const testCases = await getTestCases(SET_ID);

  for (const testCase of testCases) {
    console.log("case: ", testCase);
  }
}

testCases();
