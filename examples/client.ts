import { experiments, init } from 'gentrace/lib/init';

const PIPELINE_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';

init({
  baseURL: 'http://localhost:3000/api',
});

async function main() {
  const experimentsList = await experiments.list({ pipelineId: PIPELINE_ID });

  console.log('experimentsList', experimentsList);
}

main();
