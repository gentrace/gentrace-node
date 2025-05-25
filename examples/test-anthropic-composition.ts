import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { GentraceSampler, GentraceSpanProcessor } from 'gentrace/lib';
import process from 'process';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { composeEmail } from './functions/anthropic-composition';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const ANTHROPIC_API_KEY = readEnv('ANTHROPIC_API_KEY')!;

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY || !ANTHROPIC_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID, GENTRACE_API_KEY, and ANTHROPIC_API_KEY must be set');
}

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'anthropic-email-composition-simplified-test',
});

const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();

const traceExporter = new OTLPTraceExporter({
  url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
  },
});

// Begin OpenTelemetry SDK setup
const sdk = new NodeSDK({
  resource,
  sampler: new GentraceSampler(),
  instrumentations: [],
  spanProcessors: [
    new GentraceSpanProcessor(),
    new SimpleSpanProcessor(traceExporter),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
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

const compose = interaction('Compose Email', composeEmail, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

async function main() {
  const draft = await compose('Bob', 'Quarterly Review Meeting', 'Jane Smith');
  console.log('Draft:', draft);
}

main();

