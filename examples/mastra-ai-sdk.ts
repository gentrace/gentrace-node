/**
 * Mastra with AI SDK Example
 *
 * This example demonstrates using Gentrace with Mastra and Vercel AI SDK.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/mastra-ai-sdk.ts
 */

import { openai } from '@ai-sdk/openai';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { init, interaction } from '../src';

// Initialize Gentrace with automatic OpenTelemetry setup
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  // Create a simple Mastra agent
  const assistant = new Agent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant that answers questions concisely.',
    model: openai('gpt-4o-mini'),
  });

  // Initialize Mastra
  const mastra = new Mastra({
    agents: { assistant },
    telemetry: {
      serviceName: 'mastra-example',
      enabled: true,
    },
  });

  // Create an interaction-wrapped function
  const askAssistant = interaction(
    'ask-assistant',
    async (question: string) => {
      const response = await assistant.generate(question, {
        maxSteps: 1,
      });
      return response.text;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'assistant-pipeline',
    },
  );

  // Run the function
  console.log('Asking assistant a question...');
  const answer = await askAssistant('What is the capital of France?');
  console.log('\nAnswer:', answer);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
