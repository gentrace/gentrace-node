/**
 * Simple AI SDK Example with OpenAI
 * 
 * This example demonstrates using Gentrace with Vercel AI SDK's experimental telemetry.
 * 
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 * 
 * 2. Run the example:
 *    yarn example examples/simple-ai-sdk.ts
 */

import { init, interaction } from '../src';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
  // Initialize Gentrace with automatic OpenTelemetry setup
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    otelSetup: true,
  });

  // Create a function that uses AI SDK with experimental telemetry
  const generatePoem = interaction(
    'generate-poem',
    async (topic: string) => {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Write a short poem about ${topic}`,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            topic,
            source: 'ai-sdk-example',
          },
        },
      });
      return text;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'poem-pipeline',
    },
  );

  // Run the function
  console.log('Generating poem about the ocean...');
  const poem = await generatePoem('the ocean');
  console.log('\nPoem:', poem);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);