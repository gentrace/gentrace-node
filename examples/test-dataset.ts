import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { experiment } from 'gentrace/lib/experiment';
import { init, testCases } from 'gentrace/lib/init';
import { interaction } from 'gentrace/lib/interaction';
import { testDataset } from 'gentrace/lib/test-dataset';
import { z } from 'zod';
import { queryAi } from './functions/query';

dotenv.config();

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID');
const GENTRACE_DATASET_ID = readEnv('GENTRACE_DATASET_ID');

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY || !OPENAI_API_KEY || !GENTRACE_DATASET_ID) {
  throw new Error(
    'GENTRACE_PIPELINE_ID, GENTRACE_API_KEY, OPENAI_API_KEY and GENTRACE_DATASET_ID must be set',
  );
}

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

const InputSchema = z.object({
  query: z.string(),
});

const queryAiInteraction = interaction(GENTRACE_PIPELINE_ID, queryAi);

experiment(GENTRACE_PIPELINE_ID, async () => {
  await testDataset({
    data: async () => {
      const testCasesList = await testCases.list({ datasetId: GENTRACE_DATASET_ID });
      return testCasesList.data;
    },
    schema: InputSchema,
    interaction: queryAiInteraction,
  });
});
