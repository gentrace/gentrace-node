import { init, interaction, GentraceSampler } from '../src';
import OpenAI from 'openai';

async function main() {
  // Initialize Gentrace and automatically configure OpenTelemetry
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    sampler: new GentraceSampler(),
  });

  // Step 2: Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Step 3: Use Gentrace interaction() to wrap your OpenAI calls
  const generateResponse = interaction(
    'generate-poem',
    async (topic: string) => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes short poems.',
          },
          {
            role: 'user',
            content: `Write a short poem about ${topic}`,
          },
        ],
        max_tokens: 100,
      });

      return completion.choices[0]?.message.content;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'poem-pipeline',
    },
  );

  // Run your function
  console.log('Generating poem about the ocean...');
  const poem = await generateResponse('the ocean');
  console.log('\nPoem:', poem);

  // Wait a bit for spans to be flushed
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('\nDone!');
}

main().catch(console.error);
