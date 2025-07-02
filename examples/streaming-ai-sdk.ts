/**
 * Streaming AI SDK Example
 *
 * This example demonstrates using Gentrace with Vercel AI SDK's streaming capabilities.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/streaming-ai-sdk.ts
 */

import { init, interaction } from '../src';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Initialize Gentrace with automatic OpenTelemetry setup
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  // Create a streaming function
  const streamStory = interaction(
    'stream-story',
    async (character: string) => {
      const result = await streamText({
        model: openai('gpt-4o-mini'),
        prompt: `Tell a short story about ${character}`,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            character,
            mode: 'streaming',
          },
        },
      });

      // Collect the streamed text
      let fullText = '';
      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log('\n');

      return fullText;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'story-pipeline',
    },
  );

  // Run the streaming function
  console.log('Streaming story about a wizard...\n');
  await streamStory('a wizard');

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
