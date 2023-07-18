import { getTestSets, init } from "@gentrace/node";

async function main() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
  });

  const testSets = await getTestSets({
    label: "Monkies",
  });

  for (const testSet of testSets) {
    console.log("set: ", testSet);
  }
}

main();
