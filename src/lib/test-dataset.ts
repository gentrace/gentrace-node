import { _getClient } from './client-instance';
import { getCurrentExperimentContext } from './experiment';
import { _runTest } from './test-single';
import { checkOtelConfigAndWarn } from './otel';

/**
 * Runs a series of tests against a dataset using a provided interaction function.
 * Must be called within the context of `experiment()`.
 *
 * @template TSchema Optional schema object with a `.parse` method.
 * @template TInput The type of the single object argument the interaction function accepts (inferred from TSchema if provided).
 * @template Fn The type of the interaction function being tested.
 * @param {TestDatasetOptions<TSchema, TInput, Fn>} options An object containing the interaction function, dataset provider, and optional schema.
 * @returns {Promise<void>} A promise that resolves when all tests have been run.
 * @throws If called outside of an `experiment` context or if dataset retrieval fails.
 *
 * @example
 * const InputSchema = z.object({
 *   prompt: z.string(),
 *   temperature: z.number().optional().default(0.7),
 *   maxTokens: z.number().optional().default(100)
 * });
 *
 * experiment('your-pipeline-id', async () => {
 *   await testDataset({
 *     data: async () => {
 *       const testCasesList = await testCases.list({ datasetId: 'your-dataset-id' });
 *       return testCasesList.data;
 *     },
 *     // Optional schema to validate the 'inputs' property of each data item.
 *     schema: InputSchema,
 *     interaction: async ({ prompt, temperature, maxTokens }) => {
 *       return generateCompletion(prompt, temperature, maxTokens);
 *     }
 *   });
 */
export async function testDataset<
  TSchema extends ParseableSchema<any> | undefined = undefined,
  TInput = TSchema extends ParseableSchema<infer TOutput> ? TOutput : Record<string, any>,
>(options: TestDatasetOptions<TSchema>): Promise<void> {
  // Check if OpenTelemetry is properly configured
  checkOtelConfigAndWarn();
  
  const { interaction, data, schema } = options;

  const client = _getClient();
  const experimentContext = getCurrentExperimentContext();
  if (!experimentContext) {
    throw new Error('testDataset must be called within the context of an experiment block.');
  }

  let rawTestInputs: TestInput<Record<string, any>>[];
  try {
    const dataResult = data();
    rawTestInputs = dataResult instanceof Promise ? await dataResult : dataResult;
  } catch (error) {
    throw new Error(
      `Failed to retrieve or process dataset: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(rawTestInputs)) {
    throw new Error('Dataset function must return an array of test cases.');
  }

  const promises: Promise<void>[] = [];
  for (let i = 0; i < rawTestInputs.length; i++) {
    const inputItem = rawTestInputs[i];

    if (inputItem === undefined || inputItem === null) {
      client.logger?.warn(`Skipping undefined or null test case at index ${i}`);
      continue;
    }

    const inputs = inputItem.inputs;
    const extractedName: string | undefined = inputItem.name;
    const extractedId: string | undefined = inputItem.id;

    let finalName: string;
    if (typeof extractedName === 'string') {
      finalName = extractedName;
    } else if (typeof extractedId === 'string') {
      finalName = `Test Case (ID: ${extractedId})`;
    } else {
      finalName = `Test Case ${i + 1}`;
    }

    const finalId = extractedId;

    const spanAttributes: Record<string, string> = {};
    if (typeof finalId === 'string') {
      spanAttributes['gentrace.test_case_id'] = finalId;
    } else {
      spanAttributes['gentrace.test_case_name'] = finalName;
    }

    promises.push(
      _runTest<any, TInput>({
        spanName: finalName,
        spanAttributes,
        inputs,
        schema: schema,
        callback: interaction as (arg: TInput) => any,
      }),
    );
  }

  await Promise.all(promises);
}

/**
 * Interface for any schema object that provides a synchronous parse method.
 * Conforms to the basic structure expected by Standard Schema implementations.
 *
 * @template TOutput The expected output type after successful parsing.
 */
export interface ParseableSchema<TOutput> {
  /**
   * Parses unknown input and returns the parsed output.
   * MUST throw an error if validation fails.
   *
   * @param input The raw input data to parse.
   * @returns The parsed data conforming to TOutput.
   * @throws {Error} If parsing or validation fails.
   */
  parse: (input: unknown) => TOutput;
}

/** Represents a structured test case with explicit inputs, name, and id. */
export type TestInput<TInput extends Record<string, any>> = {
  name?: string | undefined;
  id?: string | undefined;
  inputs: TInput;
};

/**
 * Options for configuring a dataset test run.
 * The interaction function's argument type is constrained by the presence and type of the schema.
 *
 * @template TSchema Optional schema object with a `.parse` method.
 * @template TInput The type derived from the schema, or Record<string, any> if no schema.
 */
export type TestDatasetOptions<TSchema extends ParseableSchema<any> | undefined> = {
  data: () => Promise<TestInput<Record<string, any>>[]> | TestInput<Record<string, any>>[];
  schema?: TSchema;
  /**
   * The function to test. It must accept a single argument whose type ('TInput')
   * is derived from the provided 'schema', or Record<string, any> if no schema is given.
   */
  interaction: (arg: TSchema extends ParseableSchema<infer O> ? O : Record<string, any>) => any;
};
