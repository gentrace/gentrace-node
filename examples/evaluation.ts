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
 *    yarn example examples/evaluation.ts
 */

import { init, evalOnce, experiment } from '../src';

// Initialize Gentrace with automatic OpenTelemetry setup
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  const pipelineId = process.env['GENTRACE_PIPELINE_ID'];
  if (!pipelineId) {
    throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
  }

  // Run an experiment with a simple evaluation
  await experiment(pipelineId, async () => {
    // Evaluate a simple function
    await evalOnce('math-addition', async () => {
      const result = 2 + 2;
      console.log('Math result:', result);
      return result;
    });

    // Evaluate a more complex function
    await evalOnce('string-manipulation', async () => {
      const input = 'hello world';
      const result = input.toUpperCase().split(' ').reverse().join(' ');
      console.log('String result:', result);
      return result;
    });
  });

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
