import dotenv from 'dotenv';
import { init, experiment, test } from '../src';
import { readEnv } from 'gentrace/internal/utils';

dotenv.config();

init({
  baseURL: readEnv('GENTRACE_BASE_URL'),
});

const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;

experiment(PIPELINE_ID, async () => {
  test('simple-addition-test', () => {
    return 1 + 1;
  });
});
