/**
 * Manual OpenTelemetry Setup Example
 * 
 * This example demonstrates manual OpenTelemetry SDK configuration with Gentrace.
 * Use this approach when you need full control over the OpenTelemetry setup.
 * 
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 * 
 * 2. Run the example:
 *    yarn example examples/manual-otel.ts
 */

import { init, GentraceSpanProcessor, interaction } from '../src';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
  // Initialize Gentrace WITHOUT automatic OpenTelemetry setup
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    otelSetup: false,
  });

  // Manually configure OpenTelemetry SDK
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'manual-otel-example',
      [ATTR_SERVICE_VERSION]: '1.0.0',
    }),
    spanProcessors: [
      new GentraceSpanProcessor(),
      new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: `${process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api'}/otel/v1/traces`,
          headers: {
            Authorization: `Bearer ${process.env['GENTRACE_API_KEY']}`,
          },
        }),
      ),
    ],
    contextManager: new AsyncLocalStorageContextManager().enable(),
  });

  sdk.start();

  // Create a function using interaction (which will create spans automatically)
  const generateStory = interaction(
    'generate-story',
    async (character: string) => {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Write a very short story about ${character}`,
        experimental_telemetry: {
          isEnabled: true,
        },
      });
      return text;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'story-pipeline',
    },
  );

  // Run the function
  console.log('Generating story about a robot...');
  const story = await generateStory('a robot');
  console.log('\nStory:', story);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Shutdown SDK
  await sdk.shutdown();
}

main().catch(console.error);
