import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import * as dotenv from 'dotenv';
import { readEnv } from '../src/internal/utils';
import { GentraceSpanProcessor } from '../src/lib';
import { evalOnce } from '../src/lib/eval-once';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { composeEmail } from './functions/openai-composition';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY')!;

if (!GENTRACE_PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable must be set');
}

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified-test',
  }),
  instrumentations: [
    new OpenAIInstrumentation({
      exceptionLogger: (e: Error) => {
        console.error('Error logging OpenAI exception', e);
      },
    }),
  ],
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

experiment(GENTRACE_PIPELINE_ID, async () => {
  await evalOnce('Simplified Test Case', async () => {
    return await compose('TestRecipient', 'TestTopic', 'TestSender');
  });
});
