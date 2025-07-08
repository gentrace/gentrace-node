/**
 * Evaluation Concurrency Example
 *
 * This example demonstrates running evaluations with concurrency control.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # required
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/evaluation-concurrency.ts
 */

import z from 'zod';
import { evalDataset, experiment, init, interaction, testCases } from '../src';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

async function queryAi({ query }: { query: string }): Promise<string | null> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: query }],
  });
  return response.choices[0]?.message.content ?? null;
}

async function main() {
  const apiKey = process.env['GENTRACE_API_KEY'];
  const pipelineId = process.env['GENTRACE_PIPELINE_ID'];

  if (!apiKey) {
    throw new Error('GENTRACE_API_KEY environment variable must be set');
  }
  if (!pipelineId) {
    throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
  }
  const datasetId = process.env['GENTRACE_DATASET_ID'];
  if (!datasetId) {
    throw new Error('GENTRACE_DATASET_ID environment variable must be set');
  }

  // Initialize Gentrace with automatic OpenTelemetry setup
  await init({
    apiKey,
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  });

  const InputSchema = z.object({ query: z.string() });

  const instrumentedQueryAi = interaction('Query AI', queryAi, { pipelineId });

  await experiment(pipelineId, async () => {
    await evalDataset({
      data: async () => {
        const testCasesList = await testCases.list({ datasetId });
        return testCasesList.data;
      },
      schema: InputSchema,
      interaction: instrumentedQueryAi,
      maxConcurrency: 30,
    });
  });

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
