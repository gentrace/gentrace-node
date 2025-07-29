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

import { SpanStatusCode, trace } from '@opentelemetry/api';
import OpenAI from 'openai';
import { init, interaction } from '../src';

// Initialize Gentrace with OpenTelemetry setup enabled
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  // Get the tracer.
  const tracer = trace.getTracer('genai-example', '1.0.0');

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Example 1: Simple chat completion with system message
  const askQuestion = interaction(
    'ask-question',
    async (question: string) => {
      // Create a child span with GenAI semantic conventions
      return await tracer.startActiveSpan('openai-chat-completion', async (span) => {
        try {
          // Set GenAI attributes according to semantic conventions
          span.setAttributes({
            'gen_ai.system': 'openai',
            'gen_ai.request.model': 'gpt-4o-mini',
            'gen_ai.operation.name': 'chat',
            'service.name': 'genai-semantic-example',
          });

          const systemMessage = 'You are a helpful assistant that explains complex topics simply.';

          // Add system message as event
          span.addEvent('gen_ai.system.message', {
            role: 'system',
            content: systemMessage,
          });

          // Add user message as event
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

          // Add choice event for the completion
          span.addEvent('gen_ai.choice', {
            index: 0,
            content: assistantMessage,
            role: 'assistant',
            finish_reason: completion.choices[0]?.finish_reason || 'stop',
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
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'genai-example-pipeline',
    },
  );

  // Example 2: Function calling with real API invocation
  const simulateToolCall = interaction(
    'function-calling-with-api',
    async () => {
      return await tracer.startActiveSpan('openai-function-calling-simulation', async (span) => {
        try {
          span.setAttributes({
            'gen_ai.system': 'openai',
            'gen_ai.request.model': 'gpt-4o-mini',
            'gen_ai.operation.name': 'chat',
            'service.name': 'genai-semantic-example',
          });

          // Simulate a conversation that's already in progress with tool usage
          const userQuestion = "What's the weather like in San Francisco?";

          // Previous assistant response that decided to use a tool
          const assistantToolCallMessage = {
            content: '',
            tool_calls: [
              {
                id: 'call_abc123',
                type: 'function' as const,
                function: {
                  name: 'get_weather',
                  arguments: '{"location": "San Francisco, CA", "unit": "fahrenheit"}',
                },
              },
            ],
          };

          // Tool execution result
          const toolResponse = { temperature: 72, unit: 'fahrenheit', conditions: 'sunny' };
          const toolResponseString = JSON.stringify(toolResponse);

          // Add all input messages to represent the conversation history
          span.addEvent('gen_ai.user.message', {
            role: 'user',
            content: userQuestion,
          });

          span.addEvent('gen_ai.assistant.message', {
            role: 'assistant',
            content: assistantToolCallMessage.content,
            tool_calls: JSON.stringify(assistantToolCallMessage.tool_calls),
          });

          span.addEvent('gen_ai.tool.message', {
            role: 'tool',
            content: toolResponseString,
            name: 'get_weather',
            id: 'call_abc123',
          });

          // Make the actual OpenAI API call with the full conversation
          console.log('Making OpenAI API call with tool context (requesting 2 choices)...');

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'user', content: userQuestion },
              {
                role: 'assistant',
                content: assistantToolCallMessage.content,
                tool_calls: assistantToolCallMessage.tool_calls,
              },
              {
                role: 'tool',
                content: toolResponseString,
                tool_call_id: 'call_abc123',
              },
            ],
            n: 2, // Request 2 different choices
            temperature: 1, // Add some variation between choices
          });

          // Dynamically add choice events based on the API response
          completion.choices.forEach((choice, index) => {
            span.addEvent('gen_ai.choice', {
              index: index,
              content: choice.message.content || '',
              role: 'assistant',
              finish_reason: choice.finish_reason || 'stop',
            });
          });

          span.setStatus({ code: SpanStatusCode.OK });

          // Return the first choice as the primary response
          return completion.choices[0]?.message.content || '';
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
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'genai-tools-pipeline',
    },
  );

  // Example 1: Simple question
  console.log('=== Example 1: Simple Chat Completion ===');
  const question = 'Explain quantum computing in one sentence.';
  console.log(`Question: ${question}`);

  const answer = await askQuestion(question);
  console.log(`Answer: ${answer}`);

  // Example 2: Simulated function calling
  console.log('\n=== Example 2: Simulated Function Calling ===');
  console.log('Simulating a conversation with tool usage...');

  const weatherAnswer = await simulateToolCall();
  console.log(`Answer: ${weatherAnswer}`);

  // Wait for spans to flush
  console.log('\nWaiting for spans to flush...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
