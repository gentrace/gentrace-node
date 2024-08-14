import { init, getTestCase } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function full() {
  const testCase = await getTestCase("691c39f7-6b08-488d-9e8f-60e078aab726");

  console.log("test case", testCase);
}

full();
