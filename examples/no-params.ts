import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import { readEnv } from '../src/internal/utils';
import { evalOnce } from '../src/lib/eval-once';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');

if (!GENTRACE_PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}

async function main() {
  await init({
    baseURL: GENTRACE_BASE_URL,
    otelSetup: {
      serviceName: 'no-params-test',
      traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
      instrumentations: [
        new OpenAIInstrumentation({
          exceptionLogger: (e: Error) => {
            console.error('Error logging OpenAI exception', e);
          },
        }),
      ],
      debug: true,
    },
  });

  const simpleTask = () => {
    return 'Simple task completed!';
  };

  const simpleInteraction = interaction('Simple Interaction', simpleTask, {
    pipelineId: GENTRACE_PIPELINE_ID,
  });

  experiment(GENTRACE_PIPELINE_ID, async () => {
    await evalOnce('No Params Test Case', async () => {
      return await simpleInteraction();
    });
  });
}

main();
