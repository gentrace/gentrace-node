import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { ANONYMOUS_SPAN_NAME } from './constants';

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
export function interaction<F extends (...args: any[]) => any>(
  pipelineId: string,
  fn: F,
  options: InteractionSpanOptions = {},
): F {
  const tracer = trace.getTracer('gentrace-sdk');

  const fnName = fn.name;
  const interactionName = options?.name || fnName || ANONYMOUS_SPAN_NAME;

  const wrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    return tracer.startActiveSpan(interactionName, (span: Span) => {
      span.setAttribute('gentrace.pipeline_id', pipelineId);

      try {
        span.addEvent('gentrace.fn.args', {
          args: stringify(args),
        });

        const result = fn(...args);

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
              throw error;
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
        throw error;
      }
    });
  };

  // Preserve the original function's name if possible
  if (fnName) {
    Object.defineProperty(wrappedFn, 'name', { value: fnName, configurable: true });
  }

  // Return type is F to preserve the exact signature.
  return wrappedFn as F;
}
