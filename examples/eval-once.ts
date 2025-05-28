import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import * as dotenv from 'dotenv';
import { readEnv } from '../src/internal/utils';
import { GentraceSampler, GentraceSpanProcessor } from '../src/lib';
import * as process from 'process';
import { init, experiment, evalOnce } from '../src';

dotenv.config();

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;

if (!PIPELINE_ID || !GENTRACE_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID and GENTRACE_API_KEY must be set');
}

init({
  baseURL: GENTRACE_BASE_URL,
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'eval-once-test',
});

const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();

const isEdgeRuntime = process.env['NEXT_RUNTIME'] === 'edge';
const instrumentations =
  isEdgeRuntime ?
    []
  : [
      new OpenAIInstrumentation({
        exceptionLogger: (e: Error) => {
          console.error('Error logging OpenAI exception', e);
        },
      }),
    ];

let spanProcessors: SpanProcessor[];

if (process.env['ENVIRONMENT'] === 'production') {
  spanProcessors = [new GentraceSpanProcessor()];
  resource.attributes['env'] = 'production';
  resource.attributes['node.env'] = 'production';
} else {
  const traceExporter = new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
    },
  });

  spanProcessors = [
    new GentraceSpanProcessor(),
    new SimpleSpanProcessor(traceExporter),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ];

  resource.attributes['env'] = 'development';
  resource.attributes['node.env'] = 'development';
}

// Begin OpenTelemetry SDK setup
const sdk = new NodeSDK({
  resource,
  sampler: new GentraceSampler(),
  instrumentations,
  spanProcessors,
  contextManager,
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

experiment(PIPELINE_ID, async () => {
  evalOnce('simple-addition-test', () => {
    return 1 + 1;
  });
});
