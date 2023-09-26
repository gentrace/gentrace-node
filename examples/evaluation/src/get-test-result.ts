import { getTestResult, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function get() {
  const result = await getTestResult("ede8271a-699f-4db7-a198-2c51a99e2dab");

  console.log("Result info", result.runs[0].steps);
}

get();
