import { trace, SpanStatusCode, Span } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { ANONYMOUS_SPAN_NAME } from './constants';
import { ErrorType } from './utils';

/**
 * Options for configuring the behavior of the wrapInteraction function.
 * Primarily used for setting a custom span name.
 */
export type InteractionSpanOptions = {
  /**
   * Optional custom name for the interaction span.
   * Defaults to the function's name or 'anonymousInteraction'.
   */
  name?: string;
};

/**
 * Configuration options for wrapInteraction, excluding the function itself.
 */
export type InteractionConfig = {
  pipelineId: string;
  options?: InteractionSpanOptions;
};

/**
 * Wraps a function with OpenTelemetry tracing to track interactions within a pipeline.
 * Creates a span for the function execution and records its success or failure.
 * Handles functions that take either zero arguments or one argument which is a record.
 * Preserves the exact type signature (including sync/async return type) of the original function.
 *
 * @param pipelineId The ID of the pipeline this interaction belongs to.
 * @param fn The function to wrap. Must take zero args or a single record argument.
 * @param options Optional span-specific options.
 * @returns The wrapped function with the identical type signature as fn.
 */
export function interaction<
  F extends (...args: any[]) => any, // Base constraint: F is a function
>(
  pipelineId: string,
  // Use conditional type to validate function signature
  fn: Parameters<F> extends [] ?
    F // Allow zero args
  : Parameters<F> extends [infer Arg] ?
    Arg extends Record<string, any> ?
      F // Allow one arg if it extends Record<string, any>
    : ErrorType<'Interaction function argument must be assignable to Record<string, any>'>
  : ErrorType<'Interaction function must take 0 or 1 argument'>,
  options: InteractionSpanOptions = {},
): F {
  // Return type is F to preserve the exact signature
  const tracer = trace.getTracer('gentrace-sdk');

  const fnName = typeof fn === 'function' ? fn.name : '';
  const interactionName = options?.name || fnName || ANONYMOUS_SPAN_NAME;

  const wrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    return tracer.startActiveSpan(interactionName, (span: Span) => {
      span.setAttribute('gentrace.pipeline_id', pipelineId);

      try {
        const argsToLog = args.length > 0 && args[0] !== undefined ? [args[0]] : [];
        span.addEvent('gentrace.fn.args', {
          args: stringify(argsToLog),
        });

        // Add type assertion to satisfy the linter
        const result = (fn as (...args: any[]) => any)(...args);

        if (result instanceof Promise) {
          return result.then(
            (resolvedResult) => {
              span.addEvent('gentrace.fn.output', {
                output: stringify(resolvedResult),
              });
              span.end();
              return resolvedResult;
            },
            (error) => {
              span.recordException(error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
              span.setAttribute('error.type', error.name);
              span.end();
              throw error; // Re-throw the error after recording
            },
          );
        } else {
          span.addEvent('gentrace.fn.output', {
            output: stringify(result),
          });
          span.end();
          return result;
        }
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.setAttribute('error.type', error.name);
        span.end();
        throw error; // Re-throw the error after recording
      }
    });
  };

  if (fnName) {
    Object.defineProperty(wrappedFn, 'name', { value: fnName, configurable: true });
  }

  // Cast the returned function to F to match the declared return type
  return wrappedFn as F;
}
