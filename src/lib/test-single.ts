import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { stringify } from 'superjson';
import { getCurrentExperimentContext } from './experiment'; // Assuming this provides the experimentId
import { ParseableSchema } from './test-dataset'; // Import the interface
import { _getClient } from './client-instance';

/**
 * Runs a single named test case within the context of an active experiment.
 * Creates an OpenTelemetry span capturing the test execution details, result, and status.
 * Must be called within the callback of `experiment()`.
 *
 * @template TResult The expected return type of the test callback function
 * @param {string} spanName A descriptive name for the test case, used for tracing and reporting
 * @param {() => TResult | null | Promise<TResult | null>} callback The function containing the test logic
 * @returns {Promise<TResult | null>} A promise that resolves with the result of the callback function or null if an error occurs
 * @throws {Error} If called outside of an experiment context
 *
 * @example
 * await experiment('pipeline-uuid', async () => {
 *   await test('test-structural-correctness', async () => {
 *     // TODO: Implement the test logic here
 *     return someResult;
 *   });
 * });
 */
export async function test<TResult>(
  spanName: string,
  callback: () => TResult | null | Promise<TResult | null>,
): Promise<TResult | null> {
  return _runTest<TResult, any>({
    spanName,
    spanAttributes: { 'gentrace.test_case_name': spanName },
    callback,
  });
}

/**
 * Metadata for a specific test run.
 */
export type TestMetadata = Record<string, unknown>;

/**
 * Input parameters for running a single test case.
 */
export type RunTestParams<T> = {
  /** The descriptive name of the test case (like an 'it' block name). */
  name: string;
  /** The function containing the test logic. Can be sync or async. */
  callback: () => T | Promise<T>;
};

/**
 * Options for the internal _runTest function.
 *
 * @template TResult The expected return type of the test callback.
 * @template TInput The expected input type of the test callback (after potential parsing).
 */
export type RunTestInternalOptions<TResult, TInput> = {
  spanName: string;
  spanAttributes: Record<string, string>;
  rawData?: unknown | undefined;
  schema?: ParseableSchema<TInput> | undefined;
  callback: (parsedData: TInput) => TResult | null | Promise<TResult | null>;
};

/**
 * Runs a single named test case within the context of an active experiment.
 * Creates an OpenTelemetry span capturing the test execution details, result, and status.
 * Must be called within the callback of `experiment()`.
 *
 * @template T The return type of the test callback.
 * @param {string} name The name of the test case.
 * @param {() => T | Promise<T>} callback The test function to execute.
 * @returns The result of the callback function.
 * @throws If called outside of a `experiment()` context or if the callback throws.
 */
export async function _runTest<TResult, TInput = any>(
  options: RunTestInternalOptions<TResult, TInput>, // Single options parameter
): Promise<TResult | null> {
  const { spanName, spanAttributes, rawData, schema, callback } = options;

  const experimentContext = getCurrentExperimentContext();

  if (!experimentContext) {
    throw new Error(`${spanName} must be called within the context of an experiment() function.`);
  }

  const { experimentId } = experimentContext;
  const tracer = trace.getTracer('gentrace-sdk');

  return new Promise<TResult | null>((resolve, reject) => {
    tracer.startActiveSpan(spanName, async (span: Span) => {
      span.setAttribute('gentrace.experiment_id', experimentId);
      Object.entries(spanAttributes).forEach(([key, value]) => {
        span.setAttribute(key, value as any);
      });

      try {
        let dataToProcess: TInput;

        if (schema) {
          try {
            dataToProcess = schema.parse(rawData);
          } catch (parsingError: any) {
            span.recordException(parsingError);
            span.setAttribute('error.type', parsingError.name);
            throw parsingError;
          }
        } else {
          dataToProcess = rawData as TInput;
        }

        span.addEvent('gentrace.fn.args', {
          args: stringify(dataToProcess),
        });
        const result = callback(dataToProcess);

        if (result instanceof Promise) {
          result.then(
            (resolvedResult) => {
              span.addEvent('gentrace.fn.output', {
                output: stringify(resolvedResult),
              });
              span.end();
              resolve(resolvedResult);
            },
            (error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as any)?.message,
              });
              span.setAttribute('error.type', (error as any).name);
              span.end();
              reject(error);
            },
          );
        } else {
          span.addEvent('gentrace.fn.output', {
            output: stringify(result),
          });
          span.end();
          resolve(result);
        }
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message });
        span.setAttribute('error.type', error.name);
        span.end();

        // Don't reject here, just log the error. The span will record the error.
        _getClient().logger?.error(`Failed to run test case "${spanName}":`, error);
        resolve(null);
      }
    });
  });
}

export async function _testWithId<TResult, TInput = any>(
  testCaseId: string,
  caseName: string | undefined,
  rawData: unknown,
  schema: ParseableSchema<TInput> | undefined,
  callback: (parsedData: TInput) => TResult | Promise<TResult>,
): Promise<TResult | null> {
  const spanName = caseName ?? `Test Case (ID: ${testCaseId})`;
  return _runTest<TResult, TInput>({
    spanName,
    spanAttributes: { 'gentrace.test_case_id': testCaseId },
    rawData,
    schema,
    callback,
  });
}
