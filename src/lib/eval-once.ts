import { Span, SpanStatusCode, trace, context, propagation } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { getCurrentExperimentContext } from './experiment'; // Assuming this provides the experimentId
import { ParseableSchema } from './eval-dataset'; // Import the interface
import { _getClient } from './client-instance';
import {
  ATTR_GENTRACE_EXPERIMENT_ID,
  ATTR_GENTRACE_FN_ARGS,
  ATTR_GENTRACE_FN_OUTPUT,
  ATTR_GENTRACE_SAMPLE,
} from './otel/constants';
import { checkOtelConfigAndWarn } from './utils';

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
 * experiment('pipeline-uuid', () => {
 *   evalOnce('simple-addition-test', () => {
 *     return 1 + 1;
 *   });
 * });
 */
export async function evalOnce<TResult>(
  spanName: string,
  callback: () => TResult | null | Promise<TResult | null>,
): Promise<TResult | null> {
  return _runEval<TResult, any>({
    spanName,
    callback,
  });
}

/**
 * Metadata for a specific test run.
 */
export type EvalMetadata = Record<string, unknown>;

/**
 * Input parameters for running a single test case.
 */
export type RunEvalParams<T> = {
  /** The descriptive name of the test case (like an 'it' block name). */
  name: string;
  /** The function containing the test logic. Can be sync or async. */
  callback: () => T | Promise<T>;
};

/**
 * Options for the internal _runEval function.
 *
 * @template TResult The expected return type of the eval callback.
 * @template TInput The expected input type of the eval callback (after potential parsing).
 */
export type RunEvalInternalOptions<TResult, TInput> = {
  spanName: string;
  spanAttributes?: Record<string, string>;
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
export async function _runEval<TResult, TInput = any>(
  options: RunEvalInternalOptions<TResult, TInput>,
): Promise<TResult | null> {
  const { spanName, spanAttributes, inputs, schema, callback } = options;

  checkOtelConfigAndWarn();

  const experimentContext = getCurrentExperimentContext();

  if (!experimentContext) {
    throw new Error(`${spanName} must be called within the context of an experiment() function.`);
  }

  const { experimentId } = experimentContext;
  const tracer = trace.getTracer('gentrace-sdk');

  return new Promise<TResult | null>((resolve) => {
    const currentContext = context.active();
    const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

    const newBaggage = currentBaggage.setEntry(ATTR_GENTRACE_SAMPLE, {
      value: 'true',
    });
    const newContext = propagation.setBaggage(currentContext, newBaggage);

    context.with(newContext, () => {
      tracer.startActiveSpan(spanName, async (span: Span) => {
        span.setAttribute(ATTR_GENTRACE_EXPERIMENT_ID, experimentId);
        Object.entries(spanAttributes ?? {}).forEach(([key, value]) => {
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
            span.addEvent(ATTR_GENTRACE_FN_ARGS, {
              args: stringify([parsedInputs]),
            });
          }

          const boundCallback = context.bind(context.active(), callback);
          const result = boundCallback(parsedInputs);

          if (result instanceof Promise) {
            const successHandler = context.bind(context.active(), (resolvedResult: TResult | null) => {
              span.addEvent(ATTR_GENTRACE_FN_OUTPUT, {
                output: stringify(resolvedResult),
              });
              span.end();
              resolve(resolvedResult);
            });

            const errorHandler = context.bind(context.active(), (error: any) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error?.message,
              });
              span.setAttribute('error.type', error.name);
              span.end();
              resolve(null);
            });

            result.then(successHandler, errorHandler);
          } else {
            span.addEvent(ATTR_GENTRACE_FN_OUTPUT, {
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

          _getClient().logger?.error(`Failed to run test case "${spanName}":`, error);
          resolve(null);
        }
      });
    });
  });
}
