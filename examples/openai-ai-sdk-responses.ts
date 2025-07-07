/**
 * AI SDK Example with OpenAI Responses API
 *
 * This example demonstrates using Gentrace with Vercel AI SDK's experimental telemetry
 * and the OpenAI Responses API format.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/openai-ai-sdk-responses.ts
 */

import { init, interaction } from '../src';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Initialize Gentrace with automatic OpenTelemetry setup
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
});

async function main() {
  // Create a function that uses AI SDK with experimental telemetry and responses API
  const generatePoem = interaction(
    'generate-poem',
    async (topic: string) => {
      const { text } = await generateText({
        model: openai.responses('gpt-4o-mini'),
        prompt: `Write a short poem about ${topic}`,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            topic,
            source: 'ai-sdk-responses-example',
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
