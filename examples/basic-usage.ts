import { init } from 'gentrace/lib/init';
import assert from 'node:assert';
import { experiment } from '../src/lib/experiment';
import { interaction } from '../src/lib/interaction';
import { testDataset } from '../src/lib/test-dataset';
import { test } from '../src/lib/test-single';
import { z } from 'zod';

init();

// Example 1: Takes an object { name: string }
function greet(params: { name: string }): string {
  console.log('greet function called with:', params);
  // Removed getCurrentInteractionSpan() call
  return `Hello, ${params.name}!`;
}

// Example 2: Takes an object { url: string }
async function fetchAndSummarize(params: { url: string }): Promise<string> {
  console.log('fetchAndSummarize function called with:', params);
  // Removed getCurrentInteractionSpan() call
  await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate async work
  const summary = `Summary of content from ${params.url}`;
  return summary;
}

// Example 3: Takes an object { recipient: string, subject: string }
async function composeEmail(params: { recipient: string; subject: string }): Promise<string> {
  console.log('composeEmail function called with:', params);
  await new Promise((resolve) => setTimeout(resolve, 30)); // Simulate async work
  return `Email to ${params.recipient} with subject \"${params.subject}\" composed.`;
}

// No need for wrapInteraction anymore

// --- Direct Interaction Wrapping Examples ---

console.log('\n--- Direct Interaction Wrapping Examples ---');

// Wrap the original greet function (which takes a string)
// Note: The interaction wrapper adapts to the original function signature.
const wrappedGreetSimple = interaction(
  'pipeline-greet-direct', // Pipeline ID for this interaction
  (params: { name: string }): string => {
    // Original simple greet function
    console.log('greet (original signature) function called');
    return `Hello, ${params.name}!`;
  },
);

// Wrap composeEmail, providing a custom span name
const wrappedComposeEmailWithCustomName = interaction(
  'pipeline-compose-direct',
  async (params: { recipient: string; subject: string }): Promise<string> => {
    // Original composeEmail
    console.log('composeEmail (original signature) function called');
    await new Promise((resolve) => setTimeout(resolve, 30));
    return `Email to ${params.recipient} with subject \"${params.subject}\" composed.`;
  },
  { name: 'CustomComposeSpanName' }, // Optional: custom span name
);

// Call the wrapped functions directly (outside of experiment/test context)
const greeting = wrappedGreetSimple({ name: 'Direct Interaction User' });
console.log('Direct greeting result:', greeting);

async function runWrappedCompose() {
  const emailResult = await wrappedComposeEmailWithCustomName({
    recipient: 'direct@example.com',
    subject: 'Direct Interaction Test',
  });
  console.log('Direct compose result:', emailResult);
}

// --- Main Experiment Function ---

// Main function to run experiments
async function main() {
  const mainPipelineId = 'pipeline-main-experiment-id';

  // Use the experiment function
  await experiment(mainPipelineId, async () => {
    // --- Dataset Testing Examples (using testDataset) ---

    // Example: Run dataset tests using predefined input objects
    console.log('\n--- Running dataset tests with predefined inputs ---');

    const predefinedInputs = [{ inputs: { name: 'Alice' } }, { inputs: { name: 'Bob' } }];
    const wrappedGreetForDataset = interaction('pipeline-greet-dataset', greet);
    await testDataset({
      data: () => predefinedInputs,
      schema: z.object({
        name: z.string(),
      }),
      interaction: wrappedGreetForDataset,
    });

    // Example: Run dataset tests using a function that returns structured TestCase objects
    console.log('\n--- Running dataset tests with dynamic structured TestCase inputs ---');
    const fetchTestCasesFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return [
        { name: 'Test Case 1', id: 'tc-example', inputs: { url: 'https://example.com' } },
        { name: 'Test Case 2', inputs: { url: 'https://gentrace.ai' } }, // ID is optional
      ];
    };

    // Wrap the interaction first
    const wrappedFetchAndSummarizeForDataset = interaction('pipeline-summarize-dataset', fetchAndSummarize);

    await testDataset({
      data: fetchTestCasesFn,
      schema: z.object({
        url: z.string(),
      }),
      interaction: wrappedFetchAndSummarizeForDataset,
    });

    // Example: Run dataset tests with a dataset ID (This requires an implementation that fetches TestCases by ID, not shown here)
    // console.log('\n--- Running dataset tests with dataset ID (conceptual) ---');
    // const fetchByDatasetId = async (datasetId: string): Promise<TestCase<{ url: string }>[]> => {
    //   console.log(`Fetching test cases for dataset ID: ${datasetId}`);
    //   // Replace with actual API call to fetch test cases by dataset ID
    //   // const cases = await gentrace.testCases.list({ datasetId });
    //   // return cases.data.map(tc => ({ id: tc.id, name: tc.name, params: tc.inputs as { url: string } }));
    //   return [{ name: 'Fetched Case 1', id: 'ftc-1', params: { url: 'https://fetched.com' } }];
    // };
    // await testDataset(fetchAndSummarize, () => fetchByDatasetId('dataset-summarize-id'));

    // Example: Run dataset tests with a more complex interaction structure (inline function)
    console.log('\n--- Running dataset tests with inline complex interaction ---');
    // The interaction function (first arg) still takes a single object
    // The dataset (second arg) provides an array of those objects
    // Define the interaction function type explicitly for clarity
    const composeInteractionFn: (inputs: { recipient: string; subject: string }) => Promise<string> = async (
      inputs,
    ) => {
      const composed = await composeEmail(inputs);
      console.log(`Follow-up action for: ${composed}`);
      return composed;
    };

    // Define the dataset array first
    const complexDataset = [
      { inputs: { recipient: 'test1@example.com', subject: 'Test Subject 1' } },
      { inputs: { recipient: 'test2@example.com', subject: 'Test Subject 2' } },
    ];

    // Wrap the dataset array in a function
    await testDataset({
      data: () => complexDataset,
      schema: z.object({
        recipient: z.string(),
        subject: z.string(),
      }),
      interaction: composeInteractionFn,
    });

    // --- Individual Test Examples (using test with wrapped interactions) ---

    // Wrap interactions specifically for these tests
    const testGreet = interaction(
      'pipeline-greet-test',
      greet, // Use the version adapted for testDataset (takes object)
    );
    const testFetchAndSummarize = interaction(
      'pipeline-summarize-test',
      fetchAndSummarize, // Use the version adapted for testDataset
    );
    const testComposeEmail = interaction(
      'pipeline-compose-test',
      composeEmail, // Use the version adapted for testDataset
    );

    console.log('\n--- Running individual tests (calling wrapped interactions) ---');

    await test('simple greeting test', () => {
      // Call the wrapped interaction inside the test callback
      const result = testGreet({ name: 'Individual Test' });
      assert.strictEqual(result, 'Hello, Individual Test!');
    });

    await test('async summarization test', async () => {
      // Call the wrapped interaction inside the test callback
      const summary = await testFetchAndSummarize({ url: 'https://anothersite.com' });
      assert.ok(summary.includes('https://anothersite.com'));
    });

    await test('repeated interaction test', async () => {
      // Call the wrapped interaction inside the test callback
      for (let i = 0; i < 3; i++) {
        await testComposeEmail({ recipient: `loop${i}@example.com`, subject: `Loop Test ${i}` });
      }
    });

    await test('failing test example', async () => {
      console.log('This test is designed to fail...');
      // Call the wrapped interaction inside the test callback
      await testComposeEmail({ recipient: 'fail@example.com', subject: 'Failure Test' });
      assert.strictEqual(1, 2, 'Intentional assertion failure');
    });
  }).catch((error: Error) => {
    // Added type annotation for error
    // Catch errors from test or experiment callback that are re-thrown
    console.error('\nCaught an error from the experiment or a test:', error);
  });

  console.log('\nExperiment run finished.');
}

main().catch(console.error);
