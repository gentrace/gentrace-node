import { getTestCases, init } from "@gentrace/node";

const SET_ID = "e605d843-88e0-4462-85cc-2d49b0217a30";

async function testCases() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
  });

  const testCases = await getTestCases(SET_ID);

  for (const testCase of testCases) {
    console.log("case: ", testCase);
  }
}

testCases();
