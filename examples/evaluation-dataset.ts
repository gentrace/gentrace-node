/**
 * Evaluation Example
 *
 * This example demonstrates running simple evaluations with Gentrace.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # required
 *    export GENTRACE_DATASET_ID="your-dataset-id"  # required
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/evaluation-dataset.ts
 */

import z from 'zod';
import { evalDataset, experiment, init, testCases } from 'gentrace';
import { OpenAI } from 'openai';

// Initialize Gentrace with automatic OpenTelemetry setup
const apiKey = process.env['GENTRACE_API_KEY'];
if (!apiKey) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}

const pipelineId = process.env['GENTRACE_PIPELINE_ID'];
if (!pipelineId) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}

init({
  apiKey,
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
});

async function main() {
  const datasetId = process.env['GENTRACE_DATASET_ID'];

  if (!pipelineId || !datasetId) {
    throw new Error('GENTRACE_PIPELINE_ID and GENTRACE_DATASET_ID environment variables must be set');
  }

  const InputSchema = z.object({ query: z.string() });

  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Run an experiment with a simple evaluation
  const result = await experiment(
    async () => {
      await evalDataset({
        // Fetch test cases from your Gentrace dataset
        data: async () => {
          const testCasesList = await testCases.list({ datasetId });
          return testCasesList.data;
        },
        // Provide the schema to validate the inputs for each test case in the dataset
        schema: InputSchema,
        interaction: async (testCase) => {
          const { query } = testCase.inputs;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: [{ role: 'user', content: query }],
          });

          return completion.choices[0]?.message?.content || 'No response';
        },
        // Progress display is automatically determined:
        // - Interactive progress bar for local development
        // - Line-by-line output for CI/CD environments (auto-detected)
      });
    },
    { pipelineId },
  );

  console.log('Experiment URL:', result.url);
}

main().catch(console.error);
