/**
 * Example demonstrating the OpenTelemetry configuration warning
 * 
 * This example intentionally does NOT configure OpenTelemetry
 * to show the warning message that would appear to users who
 * forget to set it up.
 */

import { Gentrace, interaction, traced, experiment, evalOnce } from 'gentrace';

async function main() {
  // Initialize Gentrace without OpenTelemetry configuration
  const gentrace = new Gentrace({
    apiKey: process.env.GENTRACE_API_KEY || 'test-api-key'
  });

  console.log('=== Testing Gentrace without OpenTelemetry Configuration ===\n');

  console.log('1. Testing @interaction decorator:');
  console.log('--------------------------------');
  const greet = interaction(
    'greet',
    (input: { name: string }) => {
      return `Hello, ${input.name}!`;
    },
    { 
      pipelineId: 'test-pipeline-id'
    }
  );
  
  // This should trigger the warning
  const greeting = greet({ name: 'World' });
  console.log('Result:', greeting);

  console.log('\n2. Testing @traced decorator:');
  console.log('-----------------------------');
  const calculate = traced(
    'calculate',
    (a: number, b: number) => {
      return a + b;
    }
  );
  
  // This should NOT trigger the warning again (only shows once)
  const result = calculate(5, 3);
  console.log('Result:', result);

  console.log('\n3. Testing experiment with evalOnce:');
  console.log('------------------------------------');
  try {
    await experiment('test-experiment-id', async () => {
      await evalOnce('simple-test', () => {
        return { success: true };
      });
    });
  } catch (error) {
    console.log('Expected error (no actual API):', error.message);
  }

  console.log('\n=== Test Complete ===');
  console.log('\nYou should see the OpenTelemetry configuration warning above.');
  console.log('Note that it only appears once, even though we called multiple functions.');
}

// Run the example
main().catch(console.error);