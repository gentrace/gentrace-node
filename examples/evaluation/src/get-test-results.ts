import { getTestResults, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

async function get() {
  const results = await getTestResults("testing-pipeline-id");

  console.log(
    "results",
    results.map((r) => r.id),
  );
}

get();
