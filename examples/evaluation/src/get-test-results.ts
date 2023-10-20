import { getTestResults, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function get() {
  const results = await getTestResults("testing-pipeline-id");

  console.log("Results: ", JSON.stringify(results, null, 2));
}

get();
