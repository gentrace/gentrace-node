import { init, setup, interaction, traced, GentraceSampler } from '../src';

async function main() {
  // Initialize Gentrace first
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  });

  // Advanced configuration example
  setup({
    // Override service name detection
    serviceName: 'gentrace-advanced-example',

    // Custom resource attributes
    resourceAttributes: {
      'service.version': '2.0.0',
      'service.namespace': 'production',
      'deployment.environment': process.env['NODE_ENV'] || 'development',
      'cloud.provider': 'aws',
      'cloud.region': 'us-east-1',
    },

    // Use GentraceSampler
    sampler: new GentraceSampler(),

    // Include debug output
    debug: process.env['NODE_ENV'] === 'development',
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
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || '68cee563-ee9a-4321-848f-8df99d50c48d',
      attributes: {
        model: 'gpt-4o',
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

  // Note: The SDK automatically handles graceful shutdown on process exit
  console.log('\nExample completed successfully');
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
