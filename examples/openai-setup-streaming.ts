import { init, interaction, GentraceSampler } from '../src';
import OpenAI from 'openai';

async function main() {
  // Initialize Gentrace with OpenTelemetry configuration
  await init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    otelSetup: {
      debug: true,
      sampler: new GentraceSampler(),
    },
  });

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Example 1: Simple completion with interaction
  const chatWithAI = interaction(
    'chat-completion',
    async (message: string) => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
      });
      return response.choices[0]?.message.content;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'chat-pipeline',
    },
  );

  // Example 2: Streaming with interaction
  const streamCompletion = interaction(
    'stream-story',
    async (prompt: string) => {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative storyteller.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        max_tokens: 200,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
        fullContent += content;
      }
      console.log('\n');
      return fullContent;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'chat-pipeline',
    },
  );

  // Example 3: Multiple model calls with interaction
  const analyzeText = interaction(
    'analyze-text',
    async (text: string) => {
      // Get embeddings
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      const embedding = embeddingResponse.data[0]?.embedding;

      // Analyze sentiment
      const sentimentResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Analyze the sentiment of the text. Respond with one word: positive, negative, or neutral.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: 10,
      });
      const sentiment = sentimentResponse.choices[0]?.message.content;

      return {
        embeddingDimensions: embedding?.length || 0,
        sentiment,
      };
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'chat-pipeline',
    },
  );

  // Run examples
  console.log('=== Example 1: Simple Chat ===');
  const chatResponse = await chatWithAI('What is the capital of France?');
  console.log('Response:', chatResponse);

  console.log('\n=== Example 2: Streaming Story ===');
  console.log('Story: ');
  await streamCompletion('Write a very short story about a robot learning to paint');

  console.log('\n=== Example 3: Text Analysis ===');
  const analysis = await analyzeText('I love programming with Gentrace! It makes observability so easy.');
  console.log('Analysis:', analysis);

  console.log('\nAll done!');
}

main().catch(console.error);
