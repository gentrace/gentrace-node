import { init, setup, interaction } from '../src';

async function main() {
  // Initialize OpenTelemetry with minimal configuration
  const sdk = await setup({
    debug: true, // Enable console output for debugging
    resourceAttributes: {
      'service.version': '1.0.0',
      environment: 'development',
    },
  });

  // Initialize Gentrace
  await init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
  });

  // Wrap your function with interaction for tracing
  const generateResponse = interaction(
    'chat',
    async (prompt: string) => {
      // Simulate an AI response - replace with your actual AI call
      console.log('Processing prompt:', prompt);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API delay
      return `Echo: ${prompt}`;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'test-pipeline',
    },
  );

  // Use your wrapped function
  try {
    const result = await generateResponse('Hello, how are you today?');
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  // Graceful shutdown
  await sdk.shutdown();
}

// Run the example
main().catch(console.error);
