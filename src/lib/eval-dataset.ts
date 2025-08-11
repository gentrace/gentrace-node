import { _getClient } from './client-instance';
import { getCurrentExperimentContext } from './experiment';
import { _runEval } from './eval-once';
import { ATTR_GENTRACE_TEST_CASE_ID } from './otel/constants';
import { runWithConcurrency, isCI } from './utils';
import { ProgressReporter, BarProgressReporter, SimpleProgressReporter } from './progress';

/**
 * Runs a series of evals  against a dataset using a provided interaction function.
 * Must be called within the context of `experiment()`.
 *
 * @template TSchema Optional schema object with a `.parse` method.
 * @template TInput The type of the single object argument the interaction function accepts (inferred from TSchema if provided).
 * @template Fn The type of the interaction function being tested.
 * @param {EvalDatasetOptions<TSchema, TInput, Fn>} options An object containing the interaction function, dataset provider, and optional schema.
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
 * // Using a function that fetches data with schema validation
 * experiment('your-pipeline-id', async () => {
 *   await evalDataset({
 *     data: async () => {
 *       const testCasesList = await testCases.list({ datasetId: 'your-dataset-id' });
 *       return testCasesList.data;
 *     },
 *     // Optional schema to validate the 'inputs' property of each test case.
 *     schema: InputSchema,
 *     interaction: async (testCase) => {
 *       // testCase is the full TestInput object with validated inputs
 *       // testCase.inputs will be validated against InputSchema
 *       const { prompt, temperature, maxTokens } = testCase.inputs;
 *       return generateCompletion(prompt, temperature, maxTokens);
 *     },
 *     // Optional: limit concurrent test executions (default: unlimited)
 *     maxConcurrency: 5
 *     // showProgressBar is auto-detected based on CI environment
 *   });
 *
 * // Without schema - interaction receives the full TestInput object
 * experiment('your-pipeline-id', async () => {
 *   await evalDataset({
 *     data: [
 *       { name: 'Test 1', inputs: { prompt: 'Hello', temperature: 0.7, maxTokens: 100 } },
 *       { name: 'Test 2', inputs: { prompt: 'World', temperature: 0.5, maxTokens: 50 } }
 *     ],
 *     interaction: async (testCase) => {
 *       // testCase has properties: id, name, inputs
 *       console.log(`Running test: ${testCase.name} (${testCase.id})`);
 *       const { prompt, temperature, maxTokens } = testCase.inputs;
 *       return generateCompletion(prompt, temperature, maxTokens);
 *     }
 *   });
 * });
 */
export async function evalDataset<TSchema extends ParseableSchema<any> | undefined = undefined>(
  options: EvalDatasetOptions<TSchema>,
): Promise<void> {
  const { interaction, data, schema, maxConcurrency, showProgressBar } = options;

  // Auto-detect CI environment if showProgressBar is not explicitly set
  const useProgressBar = showProgressBar !== undefined ? showProgressBar : !isCI();

  const client = _getClient();
  const experimentContext = getCurrentExperimentContext();
  if (!experimentContext) {
    throw new Error('evalDataset must be called within the context of an experiment block.');
  }

  let rawTestInputs: TestInput<Record<string, any>>[];
  try {
    if (typeof data === 'function') {
      const dataResult = data();
      rawTestInputs = dataResult instanceof Promise ? await dataResult : dataResult;
    } else {
      rawTestInputs = data;
    }
  } catch (error) {
    throw new Error(
      `Failed to retrieve or process dataset: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!Array.isArray(rawTestInputs)) {
    throw new Error(
      'Dataset must be an array of test cases or a function that returns an array of test cases.',
    );
  }

  // Initialize progress reporter (bar or line-by-line based on preference or CI detection)
  const reporter: ProgressReporter =
    useProgressBar ? new BarProgressReporter() : new SimpleProgressReporter(client.logger);

  // Start progress reporting with pipeline ID and total count
  reporter.start(experimentContext.pipelineId, rawTestInputs.length);

  try {
    // Create array of task functions with their test names
    const tasks: Array<{ task: () => Promise<void>; name: string }> = [];

    for (let i = 0; i < rawTestInputs.length; i++) {
      const inputItem = rawTestInputs[i];

      if (inputItem === undefined || inputItem === null) {
        client.logger?.warn(`Skipping undefined or null test case at index ${i}`);
        continue;
      }

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
        spanAttributes[ATTR_GENTRACE_TEST_CASE_ID] = finalId;
      }

      // Store both the task function and its name for progress reporting
      tasks.push({
        name: finalName,
        task: async () => {
          try {
            // Update progress bar to show current test (if supported)
            if (reporter.updateCurrentTest) {
              reporter.updateCurrentTest(finalName);
            }

            await _runEval({
              spanName: finalName,
              spanAttributes,
              testCase: inputItem,
              schema: schema as TSchema,
              callback: interaction,
            });
          } finally {
            // Report progress after test completes (success or failure)
            reporter.increment(finalName);
          }
        },
      });
    }

    // Run tasks with concurrency control
    if (maxConcurrency && maxConcurrency > 0) {
      await runWithConcurrency(
        tasks.map((t) => t.task),
        maxConcurrency,
      );
    } else {
      // No concurrency limit - run all tasks in parallel
      await Promise.all(tasks.map((t) => t.task()));
    }
  } finally {
    // Always stop the reporter, even if tests fail
    reporter.stop();
  }
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
export type TestInput<TInput> = {
  name?: string | undefined;
  id?: string | undefined;
  inputs: TInput;
};

/**
 * Options for configuring a dataset eval run.
 * The interaction function's argument type is constrained by the presence and type of the schema.
 *
 * @template TSchema Optional schema object with a `.parse` method.
 * @template TInput The type derived from the schema, or TestInput<Record<string, any>> if no schema.
 */
export type EvalDatasetOptions<TSchema extends ParseableSchema<any> | undefined> = {
  data:
    | (() => Promise<TestInput<Record<string, any>>[]> | TestInput<Record<string, any>>[])
    | TestInput<Record<string, any>>[];
  schema?: TSchema;
  /**
   * The function to test. It must accept a single argument whose type ('TInput')
   * is a TestInput where the inputs property is validated by the schema (if provided).
   */
  interaction: (
    arg: TSchema extends ParseableSchema<infer O> ? TestInput<O> : TestInput<Record<string, any>>,
  ) => any;
  /**
   * The maximum number of concurrent test cases to run.
   * If not specified, all test cases will run in parallel.
   */
  maxConcurrency?: number;
  /**
   * Controls whether to display an interactive progress bar or line-by-line output.
   * - `true`: Shows an interactive progress bar in the terminal
   * - `false`: Outputs line-by-line progress, suitable for CI/CD environments
   * - `undefined` (default): Auto-detects CI environment (bar for local, line-by-line for CI)
   *
   * Note: Progress is always reported; this only controls the display format.
   *
   * When not specified, automatically detects common CI environments including:
   * GitHub Actions, GitLab CI, CircleCI, Jenkins, Azure DevOps, and more.
   *
   * @example
   * ```typescript
   * // Let the SDK auto-detect (recommended)
   * // No need to set showProgressBar
   *
   * // Or explicitly override
   * showProgressBar: true  // Force progress bar even in CI
   * showProgressBar: false // Force line-by-line even locally
   * ```
   */
  showProgressBar?: boolean;
};
