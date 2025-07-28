/**
 * Custom Configuration Example
 *
 * This example demonstrates using Gentrace with custom OpenTelemetry configuration including
 * custom service name, sampler, and resource attributes.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *    export NODE_ENV="development"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/custom-configuration.ts
 */

import { init, interaction, GentraceSampler } from '../src';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Initialize Gentrace with custom OpenTelemetry configuration
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  logLevel: 'debug',
  otelSetup: {
    serviceName: 'my-custom-service',
    sampler: new GentraceSampler(),
    resourceAttributes: {
      'service.version': '1.0.0',
      'deployment.environment': process.env['NODE_ENV'] || 'development',
    },
  },
});

async function main() {
  // Create a function to analyze text
  const analyzeText = interaction(
    'analyze-text',
    async (text: string) => {
      const { text: analysis } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Analyze the sentiment of this text: "${text}"`,
        experimental_telemetry: {
          isEnabled: true,
        },
      });
      return analysis;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'analysis-pipeline',
    },
  );

  // Run the function
  const result = await analyzeText('The weather is beautiful today!');
  console.log('Analysis:', result);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
