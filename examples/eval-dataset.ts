import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import { z } from 'zod';
import { readEnv } from '../src/internal/utils';
import { GentraceSampler } from '../src/lib';
import { evalDataset } from '../src/lib/eval-dataset';
import { experiment } from '../src/lib/experiment';
import { init, testCases } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { queryAi } from './functions/query';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_DATASET_ID = readEnv('GENTRACE_DATASET_ID')!;

if (!GENTRACE_PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable must be set');
}
if (!GENTRACE_DATASET_ID) {
  throw new Error('GENTRACE_DATASET_ID environment variable must be set');
}

async function main() {
  await init({
    baseURL: GENTRACE_BASE_URL,
    otelSetup: {
      serviceName: 'openai-email-composition-simplified-test',
      traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
      instrumentations: [
        new OpenAIInstrumentation({
          exceptionLogger: (e: Error) => {
            console.error('Error logging OpenAI exception', e);
          },
        }),
      ],
      sampler: new GentraceSampler(),
      debug: true,
    },
  });

  const InputSchema = z.object({
    query: z.string(),
  });

  const queryAiInteraction = interaction('Query AI', queryAi, {
    pipelineId: GENTRACE_PIPELINE_ID,
  });

  experiment(GENTRACE_PIPELINE_ID, async () => {
    await evalDataset({
      data: async () => {
        const testCasesList = await testCases.list({ datasetId: GENTRACE_DATASET_ID });
        return testCasesList.data;
      },
      schema: InputSchema,
      interaction: queryAiInteraction,
    });
  });
}

main();
