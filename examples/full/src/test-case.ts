import { init, getTestCase } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function full() {
  const testCase = await getTestCase("550e8400-e29b-41d4-a716-446655440000");

  console.log("test case", testCase);
}

full();
