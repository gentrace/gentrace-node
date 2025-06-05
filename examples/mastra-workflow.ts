import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { createWorkflow, createStep } from '@mastra/core/workflows';
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
    [ATTR_SERVICE_NAME]: 'mastra-workflow-example',
    [ATTR_SERVICE_VERSION]: '2.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
    'workflow.engine': 'mastra',
  }),
  sampler: new GentraceSampler({
    ratio: 1.0,
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

// Create tool for fetching location coordinates
const geocodingTool = createTool({
  id: 'geocoding',
  description: 'Convert city name to coordinates',
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string(),
  }),
  execute: async ({ context }) => {
    const tracer = trace.getTracer('mastra-workflow');
    return await tracer.startActiveSpan('geocoding-tool', { kind: SpanKind.CLIENT }, async (span) => {
      try {
        span.setAttribute('location.city', context.city);

        // Create a child span for the geocoding API call
        const apiSpan = tracer.startSpan('geocoding-api-request', {
          kind: SpanKind.CLIENT,
          attributes: {
            'http.method': 'GET',
            'http.url': `https://api.geocoding.service/v1/geocode?q=${context.city}`,
            'service.name': 'geocoding-service',
          },
        });

        // Mock geocoding data
        const mockData = {
          'New York': { latitude: 40.7128, longitude: -74.006, name: 'New York, NY', country: 'US', confidence: 0.98 },
          London: { latitude: 51.5074, longitude: -0.1278, name: 'London, UK', country: 'GB', confidence: 0.95 },
          Tokyo: { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo, Japan', country: 'JP', confidence: 0.97 },
        } as const;

        // Simulate API latency
        await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 50));

        const coords = mockData[context.city as keyof typeof mockData] || {
          latitude: 0,
          longitude: 0,
          name: context.city,
          country: 'Unknown',
          confidence: 0.5,
        };

        apiSpan.setAttributes({
          'http.status_code': 200,
          'geocoding.confidence': coords.confidence,
          'geocoding.country': coords.country,
        });
        apiSpan.setStatus({ code: SpanStatusCode.OK });
        apiSpan.end();

        span.setAttributes({
          'location.latitude': coords.latitude,
          'location.longitude': coords.longitude,
          'location.country': coords.country,
          'location.confidence': coords.confidence,
        });

        span.addEvent('geocoding_complete', {
          city: context.city,
          coordinates: `${coords.latitude},${coords.longitude}`,
          confidence: coords.confidence,
        });

        span.setStatus({ code: SpanStatusCode.OK });

        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: coords.name,
        };
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    });
  },
});

// Create weather fetch step
const fetchWeatherStep = createStep({
  id: 'fetch-weather',
  description: 'Fetches weather data for given coordinates',
  inputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number(),
    windSpeed: z.number(),
    location: z.string(),
  }),
  execute: async ({ inputData }) => {
    const tracer = trace.getTracer('mastra-workflow');
    return await tracer.startActiveSpan('fetch-weather-step', async (span) => {
      try {
        span.setAttributes({
          'weather.location': inputData.name,
          'weather.latitude': inputData.latitude,
          'weather.longitude': inputData.longitude,
        });

        // Create spans for multiple weather data sources
        const sourceSpans = await Promise.all([
          tracer.startActiveSpan('weather-source-1', { kind: SpanKind.CLIENT }, async (srcSpan) => {
            try {
              srcSpan.setAttributes({
                'weather.source': 'primary-api',
                'http.url': 'https://api.weather-primary.com/v1/current',
              });
              await new Promise((resolve) => setTimeout(resolve, 80));
              srcSpan.setStatus({ code: SpanStatusCode.OK });
              return { temperature: Math.round(20 + Math.random() * 15), source: 'primary' };
            } finally {
              srcSpan.end();
            }
          }),
          tracer.startActiveSpan('weather-source-2', { kind: SpanKind.CLIENT }, async (srcSpan) => {
            try {
              srcSpan.setAttributes({
                'weather.source': 'backup-api',
                'http.url': 'https://api.weather-backup.com/v1/current',
              });
              await new Promise((resolve) => setTimeout(resolve, 100));
              srcSpan.setStatus({ code: SpanStatusCode.OK });
              return { humidity: Math.round(40 + Math.random() * 40), source: 'backup' };
            } finally {
              srcSpan.end();
            }
          }),
        ]);

        // Aggregate weather data
        const weatherData = {
          temperature: sourceSpans[0].temperature,
          conditions:
            ['Sunny', 'Cloudy', 'Partly Cloudy', 'Overcast'][Math.floor(Math.random() * 4)] || 'Unknown',
          humidity: sourceSpans[1].humidity,
          windSpeed: Math.round(5 + Math.random() * 20),
          location: inputData.name,
          dataSources: ['primary-api', 'backup-api'],
        };

        span.setAttributes({
          'weather.temperature': weatherData.temperature,
          'weather.conditions': weatherData.conditions,
          'weather.humidity': weatherData.humidity,
          'weather.wind_speed': weatherData.windSpeed,
          'weather.data_sources': weatherData.dataSources.join(','),
        });

        span.addEvent('weather_aggregated', {
          sources_count: weatherData.dataSources.length,
          temperature: weatherData.temperature,
          conditions: weatherData.conditions,
        });

        span.setStatus({ code: SpanStatusCode.OK });

        return {
          temperature: weatherData.temperature,
          conditions: weatherData.conditions,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          location: inputData.name,
        };
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    });
  },
});

// Create analysis agent
const weatherAnalysisAgent = new Agent({
  name: 'Weather Analysis Agent',
  instructions: `You are a weather analysis expert. Analyze the provided weather data and provide:
1. A brief summary of current conditions
2. Activity recommendations based on the weather
3. Any weather-related warnings or advice`,
  model: openai('gpt-4o-mini'),
});

// Create analysis step from agent
const analyzeWeatherStep = createStep({
  id: 'analyze-weather',
  description: 'Analyzes weather data and provides recommendations',
  inputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number(),
    windSpeed: z.number(),
    location: z.string(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const tracer = trace.getTracer('mastra-workflow');
    return await tracer.startActiveSpan('analyze-weather-step', async (span) => {
      try {
        span.setAttributes({
          'analysis.location': inputData.location,
          'analysis.temperature': inputData.temperature,
        });

        const prompt = `Analyze this weather data for ${inputData.location}:
- Temperature: ${inputData.temperature}°C
- Conditions: ${inputData.conditions}
- Humidity: ${inputData.humidity}%
- Wind Speed: ${inputData.windSpeed} km/h

Provide a brief analysis with activity recommendations.`;

        // Track LLM call metrics
        const llmSpan = tracer.startSpan('llm-analysis-generation', {
          kind: SpanKind.CLIENT,
          attributes: {
            'llm.model': 'gpt-4o-mini',
            'llm.provider': 'openai',
            'llm.temperature': 0.7,
            'llm.max_tokens': 500,
          },
        });

        const startTime = Date.now();
        const response = await weatherAnalysisAgent.generate(prompt);
        const duration = Date.now() - startTime;

        llmSpan.setAttributes({
          'llm.prompt_tokens': response.usage?.promptTokens || 0,
          'llm.completion_tokens': response.usage?.completionTokens || 0,
          'llm.total_tokens': response.usage?.totalTokens || 0,
          'llm.duration_ms': duration,
          'llm.finish_reason': response.finishReason || 'unknown',
        });

        llmSpan.addEvent('llm_response_generated', {
          response_length: response.text.length,
          tokens_per_second: response.usage?.completionTokens ? (response.usage.completionTokens / duration) * 1000 : 0,
        });

        llmSpan.setStatus({ code: SpanStatusCode.OK });
        llmSpan.end();

        span.setAttribute('analysis.length', response.text.length);
        span.setAttribute('analysis.duration_ms', duration);
        span.setStatus({ code: SpanStatusCode.OK });

        return { analysis: response.text };
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    });
  },
});

// Create the workflow
const weatherAnalysisWorkflow = createWorkflow({
  id: 'weather-analysis-workflow',
  inputSchema: z.object({
    city: z.string().describe('The city to analyze weather for'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
  }),
})
  .then(createStep(geocodingTool))
  .then(fetchWeatherStep)
  .then(analyzeWeatherStep);

weatherAnalysisWorkflow.commit();

// Initialize Mastra
const mastra = new Mastra({
  agents: { weatherAnalysisAgent },
  workflows: { weatherAnalysisWorkflow },
});

// Create the interaction wrapper for tracing with workflow metrics
async function runWeatherAnalysis(city: string): Promise<string> {
  const tracer = trace.getTracer('mastra-workflow-example');
  return await tracer.startActiveSpan(
    'workflow-execution',
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'workflow.name': 'weather-analysis-workflow',
        'workflow.input.city': city,
      },
    },
    async (span) => {
      try {
        const workflow = mastra.getWorkflow('weatherAnalysisWorkflow');
        const { start } = workflow.createRun();

        const startTime = Date.now();
        const result = await start({ inputData: { city } });
        const duration = Date.now() - startTime;

        if (result.status === 'success') {
          span.setAttributes({
            'workflow.status': 'success',
            'workflow.duration_ms': duration,
            'workflow.steps_executed': 3,
            'workflow.output.length': result.result.analysis.length,
          });

          span.addEvent('workflow_completed', {
            city,
            duration_ms: duration,
            analysis_length: result.result.analysis.length,
          });

          span.setStatus({ code: SpanStatusCode.OK });
          return result.result.analysis;
        } else {
          span.setAttributes({
            'workflow.status': 'failed',
            'workflow.error': result.error?.message || 'Unknown error',
          });

          span.recordException(new Error(result.error?.message || 'Workflow failed'));
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Workflow failed' });
          throw new Error('Workflow failed');
        }
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

const weatherAnalysis = interaction('Weather Analysis Workflow', runWeatherAnalysis, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

// Main function to demonstrate the integration
async function main() {
  console.log('Mastra Workflow with Enhanced OpenTelemetry Example\n');
  console.log('Features demonstrated:');
  console.log('- Multi-step workflow with detailed span hierarchy');
  console.log('- Multiple data source aggregation with parallel spans');
  console.log('- LLM call tracking with token usage metrics');
  console.log('- Workflow execution metrics and events');
  console.log('- Geocoding confidence scores and country data\n');
  console.log('─'.repeat(80) + '\n');

  const cities = ['New York', 'London', 'Tokyo'];

  // Create a root span for the entire demo
  const rootSpan = tracer.startSpan('weather-analysis-demo', {
    kind: SpanKind.SERVER,
    attributes: {
      'demo.cities_count': cities.length,
      'demo.version': '2.0.0',
    },
  });

  const demoContext = trace.setSpan(context.active(), rootSpan);

  await context.with(demoContext, async () => {
    for (const city of cities) {
      console.log(`\n🌍 Analyzing weather for ${city}...`);
      try {
        const analysis = await weatherAnalysis(city);
        console.log(`\n📊 Analysis:\n${analysis}\n`);
        console.log('─'.repeat(80));
      } catch (error) {
        console.error(`❌ Error analyzing weather for ${city}:`, error);
      }
    }
  });

  rootSpan.addEvent('demo_completed', {
    cities_analyzed: cities.length,
  });
  rootSpan.setStatus({ code: SpanStatusCode.OK });
  rootSpan.end();

  console.log('\n✅ Demo completed! Check your Gentrace dashboard for detailed traces.');
}

main().catch(console.error);
