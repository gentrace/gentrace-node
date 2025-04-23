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

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified-test',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const DATASET_ID = readEnv('GENTRACE_DATASET_ID')!;

init({
  baseURL: readEnv('GENTRACE_BASE_URL'),
});
const openai = new OpenAI({
  apiKey: readEnv('OPENAI_API_KEY'),
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

experiment(PIPELINE_ID, async () => {
  await testDataset({
    data: async () => {
      const testCasesList = await testCases.list({ datasetId: DATASET_ID });
      return testCasesList.data;
    },
    schema: InputSchema,
    interaction: async ({ query }) => {
      return foo(query);
    },
  });
}).then(async () => await sdk.shutdown());
