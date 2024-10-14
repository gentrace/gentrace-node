import { createTestCases, init } from "@gentrace/core";
import fs from "fs/promises";
import { parse } from "node-html-parser";
import { stringify } from "csv-stringify/sync";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function createMultiple() {
  // Read the HTML file
  const htmlContent = await fs.readFile(
    "/Users/viveknair/Downloads/test.htm",
    "utf-8",
  );

  const testCases = [
    {
      name: `TC 1`,
      inputs: {
        htmlContent: htmlContent,
      },
      expectedOutputs: {},
    },
  ];

  const creationCount = await createTestCases({
    pipelineSlug: "guess-the-year",
    testCases,
  });

  console.log("Creation count", creationCount);

  // Create CSV content
  const csvContent = stringify(
    testCases.map((tc) => ({
      name: tc.name,
      htmlContent: tc.inputs.htmlContent,
      // Add other fields as needed
    })),
    {
      header: true,
      quoted: true, // Ensure all fields are quoted to handle potential delimiters in the HTML content
    },
  );

  // Write CSV file
  await fs.writeFile("test_cases.csv", csvContent, "utf-8");
  console.log("CSV file created: test_cases.csv");
}

createMultiple();
