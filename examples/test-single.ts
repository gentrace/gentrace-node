import dotenv from 'dotenv';
import { init, experiment, test } from '../src'; // Adjust path as needed
import { readEnv } from 'gentrace/internal/utils';

dotenv.config();

init({
  bearerToken: readEnv('GENTRACE_API_KEY'),
});

const PIPELINE_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';

experiment(PIPELINE_ID, async () => {
  test('simple-addition-test', () => {
    return 1 + 1;
  });
});
