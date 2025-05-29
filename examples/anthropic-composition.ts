import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import * as dotenv from 'dotenv';
import { readEnv } from '../src/internal/utils';
import { GentraceSampler, GentraceSpanProcessor } from '../src/lib';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { composeEmail } from './functions/anthropic-composition';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const ANTHROPIC_API_KEY = readEnv('ANTHROPIC_API_KEY')!;

if (!GENTRACE_PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}

if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable must be set');
}

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
console.log('Starting OTEL SDK setup...');
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'anthropic-email-composition-simplified',
  }),
  instrumentations: [],
  sampler: new GentraceSampler(),
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

const compose = interaction('Compose Email', composeEmail, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

async function main() {
  const draft = await compose('Alice', 'Project Phoenix Update', 'John Doe');
  console.log('Draft:', draft);
}

main();
