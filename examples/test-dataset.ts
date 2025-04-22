import { readEnv } from 'gentrace/internal/utils';
import { experiment } from 'gentrace/lib/experiment';
import { init, testCases } from 'gentrace/lib/init';
import { testDataset } from 'gentrace/lib/test-dataset';
import OpenAI from 'openai';
import { z } from 'zod';

const PIPELINE_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';
const DATASET_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';

init({
  baseURL: readEnv('GENTRACE_BASE_URL'),
});
const openai = new OpenAI({
  apiKey: readEnv('OPENAI_API_KEY'),
});

const InputSchema = z.object({
  a: z.number(),
  b: z.number(),
  c: z.number(),
});

const foo = async (a: number, b: number, c: number) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `What is ${a} + ${b} + ${c}?` }],
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
    interaction: async ({ a, b, c }) => {
      return foo(a, b, c);
    },
  });
});
