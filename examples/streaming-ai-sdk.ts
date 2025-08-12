/**
 * Streaming AI SDK Example
 *
 * This example demonstrates using Gentrace with Vercel AI SDK's streaming capabilities.
 *
 * How to run:
 * 1. Set environment variables:
 *    export GENTRACE_API_KEY="your-api-key"
 *    export OPENAI_API_KEY="your-openai-key"
 *    export GENTRACE_PIPELINE_ID="your-pipeline-id"  # optional
 *    export GENTRACE_BASE_URL="https://gentrace.ai/api"  # optional
 *
 * 2. Run the example:
 *    yarn example examples/streaming-ai-sdk.ts
 */

import { init, interaction } from '../src';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Initialize Gentrace with automatic OpenTelemetry setup
init({
  apiKey: process.env['GENTRACE_API_KEY'] || '',
  baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
  otelSetup: true,
});

async function main() {
  // Create a streaming function with tool messages in context
  const streamWithToolContext = interaction(
    'stream-with-tool-context',
    async (character: string) => {
      const result = streamText({
        model: openai('gpt-4o-mini'),
        messages: [
          {
            role: 'user',
            content: `Tell me about the weather and ${character}'s appearance.`,
          },
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: `I'll check the weather and get details about ${character}'s appearance.`,
              },
              {
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'getWeather',
                args: { location: 'Enchanted Forest' },
              },
              {
                type: 'tool-call',
                toolCallId: 'call_2',
                toolName: 'getCharacterDetail',
                args: { name: character, trait: 'appearance' },
              },
            ],
          },
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'call_1',
                toolName: 'getWeather',
                result: {
                  location: 'Enchanted Forest',
                  weather: 'misty with swirling magical auroras',
                  temperature: 65,
                  conditions: 'Perfect for spell casting',
                },
              },
              {
                type: 'tool-result',
                toolCallId: 'call_2',
                toolName: 'getCharacterDetail',
                result: {
                  name: character,
                  trait: 'appearance',
                  description:
                    'tall figure draped in star-speckled midnight blue robes, with a long silver beard that seems to shimmer with inner light',
                },
              },
            ],
          },
          {
            role: 'assistant',
            content: `Based on the information I've gathered:\n\nThe weather in the Enchanted Forest is misty with swirling magical auroras, at a comfortable 65°F - perfect conditions for spell casting.\n\n${character} is a tall figure draped in star-speckled midnight blue robes, with a long silver beard that seems to shimmer with inner light.`,
          },
          {
            role: 'user',
            content: `Now continue with a short story about ${character}, incorporating these details.`,
          },
        ],
        tools: {
          getWeather: tool({
            description: 'Get the current weather for the story setting',
            parameters: z.object({
              location: z.string().describe('The location in the story'),
            }),
            execute: async ({ location }) => {
              console.log(`\n[Tool Call] Getting weather for: ${location}`);
              return {
                location,
                weather: 'stormy with lightning',
                temperature: 58,
                conditions: 'Dramatic and intense',
              };
            },
          }),
          getCharacterDetail: tool({
            description: 'Get additional details about a character',
            parameters: z.object({
              name: z.string().describe('The character name'),
              trait: z.string().describe('The trait to describe'),
            }),
            execute: async ({ name, trait }) => {
              console.log(`\n[Tool Call] Getting ${trait} for character: ${name}`);
              const traits: Record<string, string> = {
                appearance: 'tall with flowing robes and a pointed hat',
                personality: 'wise, mysterious, and slightly mischievous',
                power: 'can manipulate time and space with ancient spells',
                backstory: 'trained under the ancient order of celestial mages',
              };
              return {
                name,
                trait,
                description: traits[trait] || 'mysterious and unknown',
              };
            },
          }),
        },
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            character,
            mode: 'streaming-with-tool-context',
          },
        },
      });

      // Collect the streamed text
      let fullText = '';
      console.log('Story continuation based on tool context:\n');
      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log('\n');

      return fullText;
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'story-pipeline',
    },
  );

  // Run the streaming function with tool context
  console.log('Starting conversation with pre-existing tool calls...\n');
  await streamWithToolContext('Merlin the Magnificent');

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

main().catch(console.error);
