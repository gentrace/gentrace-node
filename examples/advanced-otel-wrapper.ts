import { init, interaction, traced } from '../src';
import { setupOpenTelemetry, createAIInstrumentations } from '../src/lib/otel/setup';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ParentBasedSampler, AlwaysOnSampler } from '@opentelemetry/sdk-trace-base';
import { GentraceSampler } from '../src/lib/otel/sampler';

async function main() {
  // Advanced configuration example
  const sdk = await setupOpenTelemetry({
    serviceName: 'gentrace-advanced-example',

    // Custom resource attributes
    resourceAttributes: {
      'service.version': '2.0.0',
      'service.namespace': 'production',
      'deployment.environment': process.env['NODE_ENV'] || 'development',
      'cloud.provider': 'aws',
      'cloud.region': 'us-east-1',
    },

    // Custom sampler with parent-based sampling
    sampler: new ParentBasedSampler({
      root: new GentraceSampler(),
      remoteParentSampled: new AlwaysOnSampler(),
      remoteParentNotSampled: new GentraceSampler(),
    }),

    // Additional exporters (e.g., to another observability backend)
    additionalSpanExporters: [
      new OTLPTraceExporter({
        url: 'http://localhost:4318/v1/traces', // Local OTEL collector
      }),
    ],

    // Include console exporter only in development
    includeConsoleExporter: process.env['NODE_ENV'] === 'development',

    // AI library instrumentations
    instrumentations: await createAIInstrumentations(),

    // Additional NodeSDK configuration
    additionalConfig: {
      autoDetectResources: true,
      serviceName: 'override-if-needed', // This will be overridden by the main serviceName
    },
  });

  // Initialize Gentrace
  await init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
  });

  // Example 1: Using interaction for pipeline tracing
  const chatWithUser = interaction(
    'chat-pipeline',
    async (message: string, context?: any) => {
      // Simulate AI chat - replace with your actual AI call
      console.log('Processing message:', message);

      // Add some processing delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Return simulated response
      return `I received your message: "${message}". This is a simulated response.`;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'test-pipeline',
      attributes: {
        model: 'gpt-4',
        temperature: 0.7,
      },
    },
  );

  // Example 2: Using traced for custom function tracing
  const processData = traced('data-processing', async (data: any[]) => {
    // Simulate some data processing
    const processed = data.map((item) => ({
      ...item,
      processed: true,
      timestamp: new Date().toISOString(),
    }));

    // Add custom attributes to the span
    const span = require('@opentelemetry/api').trace.getActiveSpan();
    if (span) {
      span.setAttributes({
        'data.count': data.length,
        'data.type': 'user-records',
      });
    }

    return processed;
  });

  // Run examples
  try {
    // Example 1: Chat interaction
    console.log('Running chat interaction...');
    const chatResponse = await chatWithUser('What is OpenTelemetry and how does it work?');
    console.log('Chat response:', chatResponse);

    // Example 2: Data processing
    console.log('\nRunning data processing...');
    const testData = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];
    const processedData = await processData(testData);
    console.log('Processed data:', processedData);
  } catch (error) {
    console.error('Error:', error);
  }

  // Graceful shutdown with timeout
  console.log('\nShutting down OpenTelemetry...');
  await sdk.shutdown();
  console.log('Shutdown complete');
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
