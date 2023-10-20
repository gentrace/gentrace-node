import { getTestCases, init, updateTestCase } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function update() {
  const caseId = await updateTestCase({
    id: "4ee2b9d2-5888-4444-aa95-1b138a7fcf35",
    name: "TC 1 (Updated)",
  });

  console.log("caseId", caseId);
}

update();
