import { getTestCases, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function get() {
  const cases = await getTestCases("testing-pipeline-id");

  console.log("cases", cases);
}

get();
