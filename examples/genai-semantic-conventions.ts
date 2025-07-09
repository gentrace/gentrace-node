/**
 * GenAI Semantic Conventions Example
 *
 * This example demonstrates using OpenTelemetry GenAI semantic conventions
 * with native OTEL handles while still using Gentrace init() for setup.
 * It shows a simple LLM span wrapped by an outer interaction span.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/genai-semantic-conventions.ts
 */

import { SpanStatusCode, trace, context, propagation } from '@opentelemetry/api';
import OpenAI from 'openai';
import { init } from '../src';
import stringify from 'json-stringify-safe';

// Initialize Gentrace with OpenTelemetry setup enabled
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  const tracer = trace.getTracer('genai-example', '1.0.0');

  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  const askQuestion = async (question: string) => {
    const currentContext = context.active();
    const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

    const newBaggage = currentBaggage.setEntry('gentrace.sample', {
      value: 'true',
    });
    const newContext = propagation.setBaggage(currentContext, newBaggage);

    return await context.with(newContext, async () => {
      return await tracer.startActiveSpan('ask-question', async (span) => {
        try {
          span.setAttributes({
            'gentrace.pipeline_id': process.env['GENTRACE_PIPELINE_ID'] || 'genai-example-pipeline',
            'gentrace.sample': 'true',
            'gen_ai.system': 'openai',
            'gen_ai.request.model': 'gpt-4o-mini',
            'gen_ai.operation.name': 'chat',
            'service.name': 'genai-semantic-example',
          });

          span.addEvent('gentrace.fn.args', {
            args: stringify([question]),
          });

          const systemMessage = 'You are a helpful assistant that explains complex topics simply.';

          span.addEvent('gen_ai.system.message', {
            role: 'system',
            content: systemMessage,
          });

          span.addEvent('gen_ai.user.message', {
            role: 'user',
            content: question,
          });

          console.log('Sending chat completion request...');

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: question },
            ],
            temperature: 0.7,
          });

          const assistantMessage = completion.choices[0]?.message.content || '';

          span.addEvent('gen_ai.choice', {
            index: 0,
            content: assistantMessage,
            role: 'assistant',
            finish_reason: completion.choices[0]?.finish_reason || 'stop',
          });

          span.addEvent('gentrace.fn.output', {
            output: stringify(assistantMessage),
          });

          span.setStatus({ code: SpanStatusCode.OK });

          return assistantMessage;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
          throw error;
        } finally {
          span.end();
        }
      });
    });
  };

  const askWithTools = async (question: string) => {
    const currentContext = context.active();
    const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

    const newBaggage = currentBaggage.setEntry('gentrace.sample', {
      value: 'true',
    });
    const newContext = propagation.setBaggage(currentContext, newBaggage);

    return await context.with(newContext, async () => {
      return await tracer.startActiveSpan('ask-with-tools', async (span) => {
        try {
          span.setAttributes({
            'gentrace.pipeline_id': process.env['GENTRACE_PIPELINE_ID'] || 'genai-tools-pipeline',
            'gentrace.sample': 'true',
            'gen_ai.system': 'openai',
            'gen_ai.request.model': 'gpt-4o-mini',
            'gen_ai.operation.name': 'chat',
            'service.name': 'genai-semantic-example',
          });

          span.addEvent('gentrace.fn.args', {
            args: stringify([question]),
          });

          const tools: OpenAI.Chat.ChatCompletionTool[] = [
            {
              type: 'function',
              function: {
                name: 'get_weather',
                description: 'Get the current weather in a location',
                parameters: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', description: 'The city and state' },
                    unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
                  },
                  required: ['location'],
                },
              },
            },
          ];

          span.addEvent('gen_ai.user.message', {
            role: 'user',
            content: question,
          });

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: question }],
            tools,
            tool_choice: 'auto',
          });

          const choice = completion.choices[0];

          console.log('choice', choice);

          if (choice?.message.tool_calls) {
            span.addEvent('gen_ai.choice', {
              index: 0,
              content: choice.message.content || '',
              role: 'assistant',
              finish_reason: choice.finish_reason || 'tool_calls',
              tool_calls: JSON.stringify(choice.message.tool_calls),
            });

            const toolResponse = { temperature: 72, unit: 'fahrenheit', conditions: 'sunny' };
            const toolResponseString = JSON.stringify(toolResponse);

            span.addEvent('gen_ai.tool.message', {
              role: 'tool',
              content: toolResponseString,
              name: 'get_weather',
            });

            const finalCompletion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'user', content: question },
                choice.message,
                {
                  role: 'tool',
                  content: toolResponseString,
                  tool_call_id: choice.message.tool_calls![0]!.id,
                },
              ],
            });

            const finalMessage = finalCompletion.choices[0]?.message.content || '';

            span.addEvent('gen_ai.choice', {
              index: 0,
              content: finalMessage,
              role: 'assistant',
              finish_reason: finalCompletion.choices[0]?.finish_reason || 'stop',
            });

            span.addEvent('gentrace.fn.output', {
              output: stringify(finalMessage),
            });

            span.setStatus({ code: SpanStatusCode.OK });
            return finalMessage;
          }

          const assistantMessage = choice?.message.content || '';
          span.addEvent('gen_ai.choice', {
            index: 0,
            content: assistantMessage,
            role: 'assistant',
            finish_reason: choice?.finish_reason || 'stop',
          });

          span.addEvent('gentrace.fn.output', {
            output: stringify(assistantMessage),
          });

          span.setStatus({ code: SpanStatusCode.OK });
          return assistantMessage;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
          throw error;
        } finally {
          span.end();
        }
      });
    });
  };

  // Example 1: Simple question
  console.log('=== Example 1: Simple Chat Completion ===');
  const question = 'Explain quantum computing in one sentence.';
  console.log(`Question: ${question}`);

  const answer = await askQuestion(question);
  console.log(`Answer: ${answer}`);

  // Example 2: Function calling
  console.log('\n=== Example 2: Function Calling ===');
  const weatherQuestion = "What's the weather like in San Francisco?";
  console.log(`Question: ${weatherQuestion}`);

  const weatherAnswer = await askWithTools(weatherQuestion);
  console.log(`Answer: ${weatherAnswer}`);

  // Wait for spans to flush
  console.log('\nWaiting for spans to flush...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
