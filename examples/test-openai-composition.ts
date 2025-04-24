import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { test } from '../src/lib/test-single';
import { composeEmail } from './functions/composition';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY')!;

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY || !OPENAI_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID, GENTRACE_API_KEY, and OPENAI_API_KEY must be set');
}

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified-test',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      Authorization: `Bearer ${GENTRACE_API_KEY}`,
    },
  }),
});

sdk.start();

process.on('beforeExit', async () => {
  await sdk.shutdown();
});

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
// End OpenTelemetry SDK setup

const compose = interaction(
  GENTRACE_PIPELINE_ID,
  async ({ recipient, topic, sender }: { recipient: string; topic: string; sender: string }) => {
    return await composeEmail(recipient, topic, sender);
  },
);

experiment(GENTRACE_PIPELINE_ID, async () => {
  await test('Simplified Test Case', async () => {
    return await compose({ recipient: 'TestRecipient', topic: 'TestTopic', sender: 'TestSender' });
  });
});
