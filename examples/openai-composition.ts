import { readEnv } from '../src/internal/utils';
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

async function main() {
  await init({
    baseURL: GENTRACE_BASE_URL,
    otelSetup: {
      serviceName: 'openai-email-composition-simplified',
      traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
      debug: true,
    },
  });

  const compose = interaction('Compose Email', composeEmail, {
    pipelineId: GENTRACE_PIPELINE_ID,
  });

  const draft = await compose('Alice', 'Project Phoenix Update', 'John Doe');
  console.log('Draft:', draft);
}

main();
