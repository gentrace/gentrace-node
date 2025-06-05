import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SpanKind, SpanStatusCode, trace, context, propagation } from '@opentelemetry/api';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { Mastra } from '@mastra/core';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { readEnv } from '../src/internal/utils';
import { GentraceSampler, GentraceSpanProcessor } from '../src/lib';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';

dotenv.config();

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY');

if (!GENTRACE_PIPELINE_ID) {
  console.error('GENTRACE_PIPELINE_ID environment variable must be set');
  console.log('\nTo run this example, please set the following environment variables:');
  console.log('  GENTRACE_API_KEY=your_gentrace_api_key');
  console.log('  GENTRACE_PIPELINE_ID=your_pipeline_id');
  console.log('  OPENAI_API_KEY=your_openai_api_key');
  console.log('\nYou can create a .env file in the root directory with these values.');
  process.exit(1);
}
if (!GENTRACE_API_KEY) {
  console.error('GENTRACE_API_KEY environment variable must be set');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable must be set');
  process.exit(1);
}

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'mastra-agent-example',
    [ATTR_SERVICE_VERSION]: '2.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  sampler: new GentraceSampler({
    ratio: 1.0, // Sample all traces for this example
  }),
  instrumentations: [],
  spanProcessors: [
    new GentraceSpanProcessor(),
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
        },
      }),
    ),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
  contextManager: new AsyncLocalStorageContextManager().enable(),
});

sdk.start();

process.on('beforeExit', async () => {
  await sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
// End OpenTelemetry SDK setup

// Create a simple weather tool with enhanced telemetry
const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    const tracer = trace.getTracer('mastra-agent-example');
    return await tracer.startActiveSpan(
      'weather-tool-execution',
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'tool.name': 'get-weather',
          'weather.location': context.location,
        },
      },
      async (span) => {
        try {
          // Simulate weather API call with network span
          const apiSpan = tracer.startSpan('weather-api-call', {
            kind: SpanKind.CLIENT,
            attributes: {
              'http.method': 'GET',
              'http.url': `https://api.weather.com/v1/locations/${context.location}`,
              'http.target': `/v1/locations/${context.location}`,
            },
          });

          const mockWeatherData = {
            'New York': { temperature: 72, conditions: 'Sunny', humidity: 45, windSpeed: 10 },
            London: { temperature: 62, conditions: 'Cloudy', humidity: 70, windSpeed: 15 },
            Tokyo: { temperature: 80, conditions: 'Clear', humidity: 60, windSpeed: 5 },
            Paris: { temperature: 68, conditions: 'Partly Cloudy', humidity: 55, windSpeed: 8 },
          } as const;

          // Simulate API latency
          await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

          const weather = mockWeatherData[context.location as keyof typeof mockWeatherData] || {
            temperature: 70,
            conditions: 'Unknown',
            humidity: 50,
            windSpeed: 10,
          };

          apiSpan.setAttributes({
            'http.status_code': 200,
            'weather.temperature': weather.temperature,
            'weather.conditions': weather.conditions,
          });
          apiSpan.setStatus({ code: SpanStatusCode.OK });
          apiSpan.end();

          span.addEvent('weather_data_retrieved', {
            location: context.location,
            temperature: weather.temperature,
            conditions: weather.conditions,
          });

          span.setStatus({ code: SpanStatusCode.OK });

          return {
            temperature: weather.temperature,
            conditions: weather.conditions,
            location: context.location,
          };
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  },
});

// Create a Mastra agent with the weather tool
const weatherAgent = new Agent({
  name: 'Weather Assistant',
  instructions: `You are a helpful weather assistant that provides accurate weather information.
When asked about weather, always use the weather tool to get current data.
Be concise but informative in your responses.`,
  model: openai('gpt-4o-mini'),
  tools: {
    weatherTool,
  },
});

// Initialize Mastra instance
const mastra = new Mastra({
  agents: { weatherAgent },
});

// Create the interaction wrapper for tracing with enhanced telemetry
async function queryWeatherAgent(question: string): Promise<string> {
  const tracer = trace.getTracer('mastra-agent-example');
  return await tracer.startActiveSpan(
    'agent-generation',
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'agent.name': 'Weather Assistant',
        'prompt.length': question.length,
        'generation.max_steps': 3,
      },
    },
    async (span) => {
      try {
        // Add baggage for distributed context
        const baggage = propagation.createBaggage({
          'agent.type': { value: 'weather' },
          'session.id': { value: `session-${Date.now()}` },
        });
        context.with(propagation.setBaggage(context.active(), baggage), async () => {
          // Agent generation happens here
        });

        const startTime = Date.now();
        const response = await weatherAgent.generate(question, {
          maxSteps: 3,
        });
        const duration = Date.now() - startTime;

        span.setAttributes({
          'response.length': response.text.length,
          'response.duration_ms': duration,
          'response.tool_calls': response.toolCalls?.length || 0,
        });

        // Log tool calls as events
        if (response.toolCalls && response.toolCalls.length > 0) {
          response.toolCalls.forEach((toolCall, index) => {
            span.addEvent(`tool_call_${index}`, {
              tool_name: toolCall.toolName,
              tool_args: JSON.stringify(toolCall.args),
            });
          });
        }

        span.addEvent('generation_complete', {
          tokens_used: response.usage?.totalTokens || 0,
          finish_reason: response.finishReason || 'unknown',
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return response.text;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

const weatherQuery = interaction('Query Weather Agent', queryWeatherAgent, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

// Main function to demonstrate the integration
async function main() {
  console.log('Mastra Agent with Enhanced OpenTelemetry Example\n');
  console.log('Features demonstrated:');
  console.log('- Detailed tool execution tracing with network spans');
  console.log('- Agent generation metrics and events');
  console.log('- Distributed context propagation with baggage');
  console.log('- Custom span attributes and events\n');
  console.log('─'.repeat(60) + '\n');

  const questions = [
    "What's the weather like in New York?",
    'Tell me about the weather in London and Tokyo',
    'Is it sunny in Paris today?',
  ];

  for (const question of questions) {
    console.log(`❓ Question: ${question}`);
    const answer = await weatherQuery(question);
    console.log(`✅ Answer: ${answer}\n`);
    console.log('─'.repeat(60) + '\n');
  }

  console.log('Check your Gentrace dashboard for detailed traces!');
}

main().catch(console.error);
