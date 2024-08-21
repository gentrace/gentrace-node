import { getTestCases, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
});

async function full() {
  const testCases = await getTestCases("monkies");

  console.log("test cases", testCases);

  const testCaseCount = testCases.length;
  console.log("Number of test cases:", testCaseCount);
}

full();
