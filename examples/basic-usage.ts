import { init } from 'gentrace/lib/init';
import assert from 'node:assert';
import { experiment } from '../src/lib/experiment';
import { interaction } from '../src/lib/interaction';
import { testDataset } from '../src/lib/test-dataset';
import { test } from '../src/lib/test-single';
import { z } from 'zod';

init();


function greet(params: { name: string }): string {
  console.log('greet function called with:', params);
  return `Hello, ${params.name}!`;
}

async function fetchAndSummarize(params: { url: string }): Promise<string> {
  console.log('fetchAndSummarize function called with:', params);
  await new Promise((resolve) => setTimeout(resolve, 50));
  const summary = `Summary of content from ${params.url}`;
  return summary;
}


async function composeEmail(params: { recipient: string; subject: string }): Promise<string> {
  console.log('composeEmail function called with:', params);
  await new Promise((resolve) => setTimeout(resolve, 30));
  return `Email to ${params.recipient} with subject \"${params.subject}\" composed.`;
}





console.log('\n--- Direct Interaction Wrapping Examples ---');



const wrappedGreetSimple = interaction(
  'pipeline-greet-direct', // Pipeline ID for this interaction
  (params: { name: string }): string => {
    // Original simple greet function
    console.log('greet (original signature) function called');
    return `Hello, ${params.name}!`;
  },
);


const wrappedComposeEmailWithCustomName = interaction(
  'pipeline-compose-direct',
  async (params: { recipient: string; subject: string }): Promise<string> => {
    
    console.log('composeEmail (original signature) function called');
    await new Promise((resolve) => setTimeout(resolve, 30));
    return `Email to ${params.recipient} with subject \"${params.subject}\" composed.`;
  },
  { name: 'CustomComposeSpanName' }, 
);


const greeting = wrappedGreetSimple({ name: 'Direct Interaction User' });
console.log('Direct greeting result:', greeting);

async function runWrappedCompose() {
  const emailResult = await wrappedComposeEmailWithCustomName({
    recipient: 'direct@example.com',
    subject: 'Direct Interaction Test',
  });
  console.log('Direct compose result:', emailResult);
}




async function main() {
  const mainPipelineId = 'pipeline-main-experiment-id';
 
  await experiment(mainPipelineId, async () => {
    

    
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

    
    
    
    
    
    
    
    
    
    

    
    console.log('\n--- Running dataset tests with inline complex interaction ---');
    
    
    
    const composeInteractionFn: (inputs: { recipient: string; subject: string }) => Promise<string> = async (
      inputs,
    ) => {
      const composed = await composeEmail(inputs);
      console.log(`Follow-up action for: ${composed}`);
      return composed;
    };

    
    const complexDataset = [
      { inputs: { recipient: 'test1@example.com', subject: 'Test Subject 1' } },
      { inputs: { recipient: 'test2@example.com', subject: 'Test Subject 2' } },
    ];

    
    await testDataset({
      data: () => complexDataset,
      schema: z.object({
        recipient: z.string(),
        subject: z.string(),
      }),
      interaction: composeInteractionFn,
    });

    

    
    const testGreet = interaction(
      'pipeline-greet-test',
      greet, 
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
      
      const result = testGreet({ name: 'Individual Test' });
      assert.strictEqual(result, 'Hello, Individual Test!');
    });

    await test('async summarization test', async () => {
      
      const summary = await testFetchAndSummarize({ url: 'https://anothersite.com' });
      assert.ok(summary.includes('https://anothersite.com'));
    });

    await test('repeated interaction test', async () => {
      
      for (let i = 0; i < 3; i++) {
        await testComposeEmail({ recipient: `loop${i}@example.com`, subject: `Loop Test ${i}` });
      }
    });

    await test('failing test example', async () => {
      console.log('');
      await testComposeEmail({ recipient: 'fail@example.com', subject: 'Failure Test' });
      assert.strictEqual(1, 2, 'Intentional assertion failure');
    });
  }).catch((error: Error) => {
    console.error('\nCaught an error from the experiment or a test:', error);
  });

  console.log('\nExperiment run finished.');
}

main().catch(console.error);
