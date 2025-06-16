import { init, setup, interaction } from '../src';

async function main() {
  // Step 1: Initialize Gentrace first
  await init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  });

  // Step 2: Setup OpenTelemetry - no parameters needed!
  await setup();

  // Step 3: Use Gentrace features
  const generateResponse = interaction(
    'chat',
    async (prompt: string) => {
      console.log('Processing prompt:', prompt);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return `Echo: ${prompt}`;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'test-pipeline',
    },
  );

  // Run your function
  const result = await generateResponse('Hello, world!');
  console.log('Response:', result);
}

// Run the example
main().catch(console.error);
