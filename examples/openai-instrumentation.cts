const { OpenAIInstrumentation } = require('@traceloop/instrumentation-openai');
const { readEnv } = require('../src/internal/utils');
const { init } = require('../src/lib/init');
const { interaction } = require('../src/lib/interaction');

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY')!;

if (!GENTRACE_PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable must be set');
}

async function setupAndRun() {
  // Initialize Gentrace with OpenAI instrumentation
  await init({
    baseURL: GENTRACE_BASE_URL,
    otelSetup: {
      serviceName: 'openai-instrumentation-cts',
      traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
      instrumentations: [
        new OpenAIInstrumentation({
          traceContent: true,
          captureStreaming: true,
          exceptionLogger: (e: Error) => {
            console.error('OpenAI instrumentation exception:', e);
          },
        }),
      ],
      debug: true,
    },
  });

  // Require OpenAI AFTER instrumentation setup
  const OpenAI = require('openai');

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  // Create a simple test interaction
  const testOpenAI = interaction(
    'test-openai-cts',
    async (prompt: string) => {
      console.log('Testing OpenAI with prompt:', prompt);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      });

      const response = completion.choices[0]?.message?.content || 'No response';
      console.log('OpenAI response:', response);
      console.log('Model used:', completion.model);
      console.log('Tokens used:', completion.usage);

      return response;
    },
    {
      pipelineId: GENTRACE_PIPELINE_ID,
    },
  );

  console.log('🔍 Testing OpenAI Instrumentation (.cts CommonJS file)\n');

  try {
    const result = await testOpenAI('What is 2 + 2? Answer in one word.');
    console.log('\nFinal result:', result);

    // Wait for spans to flush
    console.log('\nWaiting for spans to flush...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('\n✅ Test completed!');
    console.log('Check the console output for OpenAI spans.');
  } catch (error) {
    console.error('Error:', error);
  }
}

setupAndRun();
