/**
 * Anthropic AI SDK Example
 * 
 * This example demonstrates using Gentrace with Vercel AI SDK's experimental telemetry for Anthropic models.
 * 
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export ANTHROPIC_API_KEY="your-anthropic-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 * 
 * 2. Run the example:
 *    yarn example examples/anthropic-ai-sdk.ts
 */

import { init, interaction } from '../src';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

async function main() {
  // Initialize Gentrace with automatic OpenTelemetry setup
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    otelSetup: true,
  });

  // Create a function that uses Anthropic via AI SDK
  const generateSummary = interaction(
    'generate-summary',
    async (text: string) => {
      const { text: summary } = await generateText({
        model: anthropic('claude-3-haiku-20240307'),
        prompt: `Summarize this text in 2-3 sentences: ${text}`,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            textLength: text.length,
            source: 'anthropic-ai-sdk-example',
          },
        },
      });
      return summary;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'summary-pipeline',
    },
  );

  // Run the function
  const longText = `The rapid advancement of artificial intelligence has transformed numerous industries, 
  from healthcare to finance. Machine learning algorithms now assist doctors in diagnosing diseases, 
  help financial institutions detect fraud, and enable autonomous vehicles to navigate complex environments. 
  As these technologies continue to evolve, they promise to bring even more revolutionary changes to our daily lives.`;
  
  console.log('Generating summary...');
  const summary = await generateSummary(longText);
  console.log('\nSummary:', summary);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);