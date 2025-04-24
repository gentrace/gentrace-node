import { readEnv } from 'gentrace/internal/utils';
import { experiment } from 'gentrace/lib/experiment';
import { init, testCases } from 'gentrace/lib/init';
import { testDataset } from 'gentrace/lib/test-dataset';
import OpenAI from 'openai';
import { z } from 'zod';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';

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
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('beforeExit', async () => {
  await sdk.shutdown();
});

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
// End OpenTelemetry SDK setup

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const InputSchema = z.object({
  query: z.string(),
});

const foo = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [{ role: 'user', content: query }],
  });
  return response.choices[0]!.message.content;
};

experiment(GENTRACE_PIPELINE_ID, async () => {
  await testDataset({
    data: async () => {
      const testCasesList = await testCases.list({ datasetId: GENTRACE_DATASET_ID });
      return testCasesList.data;
    },
    schema: InputSchema,
    interaction: async ({ query }) => {
      return foo(query);
    },
  });
}).then(async () => await sdk.shutdown());
