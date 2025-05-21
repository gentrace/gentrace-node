import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { getCurrentExperimentContext } from './experiment';
import { ParseableSchema } from './test-dataset';
import { _getClient } from './client-instance';

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
  inputs?: unknown | undefined;
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
  const { spanName, spanAttributes, inputs, schema, callback } = options;

  const experimentContext = getCurrentExperimentContext();

  if (!experimentContext) {
    throw new Error(`${spanName} must be called within the context of an experiment() function.`);
  }

  const { experimentId } = experimentContext;
  const tracer = trace.getTracer('gentrace-sdk');

  return new Promise<TResult | null>((resolve) => {
    tracer.startActiveSpan(spanName, async (span: Span) => {
      span.setAttribute('gentrace.experiment_id', experimentId);
      Object.entries(spanAttributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });

      try {
        let parsedInputs: TInput;

        if (schema) {
          try {
            parsedInputs = schema.parse(inputs);
          } catch (parsingError: any) {
            span.recordException(parsingError);
            span.setAttribute('error.type', parsingError.name);
            throw parsingError;
          }
        } else {
          parsedInputs = inputs as TInput;
        }

        if (parsedInputs) {
          span.addEvent('gentrace.fn.args', {
            args: stringify([parsedInputs]),
          });
        }

        const result = callback(parsedInputs);

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
              resolve(null);
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
