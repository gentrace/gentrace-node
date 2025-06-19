import { init, setup, interaction, GentraceSampler } from '../src';

async function main() {
  // Initialize Gentrace WITHOUT automatic OpenTelemetry configuration
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    otelSetup: false, // Disable automatic OpenTelemetry setup
  });

  // Manually configure OpenTelemetry later (if needed)
  // This gives you full control over when and how OpenTelemetry is configured
  setup({
    sampler: new GentraceSampler(),
    debug: true,
  });

  // Example usage
  const testFunction = interaction(
    'manual-setup-test',
    async (input: string) => {
      console.log('Processing:', input);
      return `Processed: ${input}`;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'test-pipeline',
    },
  );

  const result = await testFunction('Hello from manual setup!');
  console.log('Result:', result);

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Done!');
}

main().catch(console.error);
