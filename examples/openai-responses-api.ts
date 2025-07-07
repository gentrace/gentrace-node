/**
 * OpenAI Responses API Example with GenAI Semantic Conventions
 *
 * This example demonstrates using OpenAI's responses API with manual OpenTelemetry
 * instrumentation following GenAI semantic conventions, wrapped in a Gentrace interaction.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/openai-responses-api.ts
 */

import { SpanStatusCode, trace } from '@opentelemetry/api';
import OpenAI from 'openai';
import { init, interaction } from '../src';
import { Response } from 'openai/resources/responses/responses';

// Initialize Gentrace with OpenTelemetry setup enabled
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
});

function extractContentFromResponse(response: Response): {
  content: string;
  finishReason: string;
} {
  const outputItems = response.output || [];
  let mainContent = '';

  for (const item of outputItems) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const contentItem of item.content) {
        if (contentItem.type === 'output_text') {
          mainContent = contentItem.text || '';
          break;
        }
      }
      if (mainContent) break;
    }
  }

  return { content: mainContent, finishReason: 'stop' };
}

async function main() {
  // Get the tracer
  const tracer = trace.getTracer('openai-responses-example', '1.0.0');

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Create a function using interaction that generates stories with the responses API
  const generateStory = interaction(
    'generate-bedtime-story',
    async (topic: string) => {
      // Create a child span with GenAI semantic conventions
      return await tracer.startActiveSpan('openai-response-generation', async (span) => {
        try {
          // Set GenAI attributes according to semantic conventions
          span.setAttributes({
            'gen_ai.system': 'openai',
            'gen_ai.request.model': 'gpt-4.1',
            'gen_ai.operation.name': 'response',
            'service.name': 'openai-responses-example',
          });

          const prompt = `Tell me a three sentence bedtime story about ${topic}.`;

          // Add user message as event
          span.addEvent('gen_ai.user.message', {
            role: 'user',
            content: prompt,
          });

          console.log(`Generating bedtime story about ${topic}...`);

          const response = await openai.responses.create({
            model: 'gpt-4.1',
            input: prompt,
          });

          const { content, finishReason } = extractContentFromResponse(response);

          // Add choice event for the completion
          span.addEvent('gen_ai.choice', {
            index: 0,
            content: content,
            role: 'assistant',
            finish_reason: finishReason,
          });

          // Add usage metrics as attributes if available
          if (response.usage) {
            span.setAttributes({
              'gen_ai.usage.input_tokens': response.usage.input_tokens,
              'gen_ai.usage.output_tokens': response.usage.output_tokens,
              'gen_ai.usage.total_tokens': response.usage.total_tokens,
            });
          }

          span.setStatus({ code: SpanStatusCode.OK });

          return content;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
          throw error;
        } finally {
          span.end();
        }
      });
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'bedtime-story-pipeline',
    },
  );

  // Run examples
  console.log('=== Simple Bedtime Story ===');
  const story = await generateStory('a unicorn');
  console.log('Story:', story);

  // Wait for spans to flush
  console.log('\nWaiting for spans to flush...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
