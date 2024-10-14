import {
  createTestCases,
  getTestCases,
  getTestCasesForDataset,
  init,
} from "@gentrace/core";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TestCase = z.object({
  sender: z.string(),
  receiver: z.string(),
  query: z.string(),
});

const TestCasesResponse = z.object({
  test_cases: z.array(TestCase),
});

async function getAndDuplicateCases() {
  const PIPELINE_SLUG = "testing-pipeline-id";

  try {
    // Get all test cases for the pipeline
    const cases = await getTestCasesForDataset(
      "a4eb18dc-8738-4056-a363-ab57845c5ec9",
    );

    if (cases.length === 0) {
      console.log("No test cases found for the pipeline.");
      return;
    }

    // Log the number of cases retrieved
    console.log("[CASES_INFO] Number of cases retrieved:", cases.length);

    // Log details of the first few cases (up to 3)
    const casesToLog = cases.slice(0, 3);
    casesToLog.forEach((testCase, index) => {
      console.log(`[CASES_INFO] Case ${index + 1} details:`, {
        id: testCase.id,
        name: testCase.name,
        inputKeys: Object.keys(testCase.inputs),
      });
    });

    // If there are more cases, log a message indicating so
    if (cases.length > 3) {
      console.log(`[CASES_INFO] ... and ${cases.length - 3} more cases`);
    }

    // Get the first test case
    const firstCase = cases[0];

    // Generate 10 new test cases using OpenAI
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o", // Using the latest model that supports response_format
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates test cases.",
        },
        {
          role: "user",
          content: `Generate 10 test cases similar to this one: ${JSON.stringify(firstCase.inputs)}`,
        },
      ],
      response_format: zodResponseFormat(
        TestCasesResponse,
        "test_cases_response",
      ),
    });

    const generatedCases = completion.choices[0].message.parsed.test_cases;

    // Create the new test cases
    const creationCount = await createTestCases({
      pipelineSlug: PIPELINE_SLUG,
      testCases: generatedCases.map((genCase) => ({
        name: `Generated case: ${genCase.query.substring(0, 30)}...`,
        inputs: genCase,
        expectedOutputs: firstCase.expectedOutputs, // Using the same expected outputs as the first case
      })),
    });

    console.log(`Successfully created ${creationCount} new test cases.`);
  } catch (error) {
    console.error("Error:", error);
  }
}

getAndDuplicateCases();
