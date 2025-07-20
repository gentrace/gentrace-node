/**
 * Evaluation Example
 *
 * This example demonstrates running simple evaluations with Gentrace.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # required
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/evaluation-dataset.ts
 */

import { testCases } from 'gentrace/lib/init';
import z from 'zod';
import { evalDataset, experiment, init, interaction } from '../src';

async function queryAi({ query }: { query: string }): Promise<string | null> {
  console.log(`Received query: ${query}`);
  // Simulate an AI call with a fake response
  await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
  const fakeResponse = `This is a fake explanation for "${query}".`;
  return fakeResponse;
}

// Initialize Gentrace with automatic OpenTelemetry setup
const apiKey = process.env['GENTRACE_API_KEY'];
if (!apiKey) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}

init({
  apiKey,
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
});

async function main() {
  const pipelineId = process.env['GENTRACE_PIPELINE_ID'];
  const datasetId = process.env['GENTRACE_DATASET_ID'];

  if (!pipelineId || !datasetId) {
    throw new Error('GENTRACE_PIPELINE_ID and GENTRACE_DATASET_ID environment variables must be set');
  }

  const InputSchema = z.object({ query: z.string() });

  const instrumentedQueryAi = interaction(
    'Query AI', // Explicitly set the name of the interaction
    queryAi, // Pass the original function
    { pipelineId },
  );

  // Run an experiment with a simple evaluation
  const result = await experiment(pipelineId, async () => {
    await evalDataset({
      // Fetch test cases from your Gentrace dataset
      data: async () => {
        const testCaseList = await testCases.list({ datasetId });
        return testCaseList.data;
      },
      // Provide the schema to validate the inputs for each test case in the dataset
      schema: InputSchema,
      // Provide the instrumented function to run against each test case
      interaction: instrumentedQueryAi,
    });
  });

  console.log('Experiment URL:', result.url);
}

main().catch(console.error);
