import dotenv from 'dotenv';
import { init, experiment, evalOnce } from '../src';
import { readEnv } from 'gentrace/internal/utils';

dotenv.config();

init({
  baseURL: readEnv('GENTRACE_BASE_URL'),
});

const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;

experiment(PIPELINE_ID, async () => {
  evalOnce('simple-addition-test', () => {
    return 1 + 1;
  });
});
