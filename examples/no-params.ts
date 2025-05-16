import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { experiment } from 'gentrace/lib/experiment';
import { init } from 'gentrace/lib/init';
import { interaction } from 'gentrace/lib/interaction';
import { evalOnce } from 'gentrace/lib/eval-once';

dotenv.config();

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID and GENTRACE_API_KEY must be set');
}

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'no-params-test',
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

const simpleTask = () => {
  return 'Simple task completed!';
};

const simpleInteraction = interaction(GENTRACE_PIPELINE_ID, simpleTask);

experiment(GENTRACE_PIPELINE_ID, async () => {
  await evalOnce('No Params Test Case', async () => {
    return await simpleInteraction();
  });
});
