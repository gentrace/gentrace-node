import { evalOnce, experiment, init } from '../src';
import { readEnv } from '../src/internal/utils';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID');

if (!PIPELINE_ID) {
  throw new Error('GENTRACE_PIPELINE_ID environment variable must be set');
}
if (!GENTRACE_API_KEY) {
  throw new Error('GENTRACE_API_KEY environment variable must be set');
}

async function main() {
  await init({
    baseURL: GENTRACE_BASE_URL,
    otelSetup: {
      serviceName: 'eval-once-test',
      traceEndpoint: `${GENTRACE_BASE_URL}/otel/v1/traces`,
      debug: true,
    },
  });

  experiment(PIPELINE_ID, async () => {
    evalOnce('simple-addition-test', () => {
      return 1 + 1;
    });
  });
}

main();
