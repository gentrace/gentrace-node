import { readEnv } from '../src/internal/utils';
import { GentraceSampler } from '../src/lib';
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

init({
  baseURL: GENTRACE_BASE_URL,
  otelSetup: {
    serviceName: 'anthropic-email-composition-simplified',
    traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    sampler: new GentraceSampler(),
    debug: true,
  },
});

async function main() {
  console.log('OpenTelemetry SDK started successfully');

  const compose = interaction('Compose Email', composeEmail, {
    pipelineId: GENTRACE_PIPELINE_ID,
  });

  const draft = await compose('Alice', 'Project Phoenix Update', 'John Doe');
  console.log('Draft:', draft);
}

main();
