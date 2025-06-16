import { setupOpenTelemetry } from '../src/lib/otel/setup';
import { init, interaction } from '../src';

/**
 * Test script to verify OpenTelemetry wrapper compatibility
 * This can be tested with both OTEL v1 and v2 by adjusting package.json dependencies
 */
async function testWrapper() {
  console.log('Testing OpenTelemetry wrapper compatibility...\n');

  try {
    // Get OpenTelemetry version
    const otelApi = await import('@opentelemetry/api');
    console.log('OpenTelemetry API loaded successfully');

    // Initialize OpenTelemetry with minimal config
    console.log('Initializing OpenTelemetry...');
    const sdk = await setupOpenTelemetry({
      serviceName: 'otel-compatibility-test',
      includeConsoleExporter: true,
    });
    console.log('✓ OpenTelemetry initialized successfully');

    // Initialize Gentrace
    console.log('\nInitializing Gentrace...');
    await init({
      apiKey: process.env['GENTRACE_API_KEY'] || 'test-key',
    });
    console.log('✓ Gentrace initialized successfully');

    // Create a test function
    const testFunction = interaction(
      'test-function',
      async (input: string) => {
        console.log(`Processing: ${input}`);
        return `Processed: ${input}`;
      },
      {
        pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'test-pipeline',
      },
    );

    // Execute the test function
    console.log('\nExecuting test function...');
    const result = await testFunction('Hello OpenTelemetry!');
    console.log('✓ Result:', result);

    // Wait a bit for spans to be processed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Shutdown
    console.log('\nShutting down...');
    await sdk.shutdown();
    console.log('✓ Shutdown complete');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWrapper().catch(console.error);
