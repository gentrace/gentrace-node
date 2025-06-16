import { init, setup, interaction } from '../src';

async function main() {
  // Step 1: Initialize Gentrace first
  await init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  });

  // Step 2: Setup OpenTelemetry - no parameters needed!
  await setup();

  // Step 3: Use Gentrace interaction() to wrap your function
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
  console.log('Calling generateResponse...');
  const result = await generateResponse('Hello, world!');
  console.log('Response:', result);

  // Wait a bit for spans to be flushed
  console.log('Waiting for spans to be flushed...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('Done!');
}

main();
