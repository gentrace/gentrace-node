import { trace, SpanStatusCode, Span } from '@opentelemetry/api';
import { stringify } from 'superjson';

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
 * This version enforces that the function takes exactly one argument, which must be a record,
 * and preserves the exact type signature of the original function.
 *
 * @template Arg - The type of the single record argument the function takes.
 * @template Return - The return type of the function.
 * @param {string} pipelineId - The ID of the pipeline this interaction belongs to.
 * @param {(arg: Arg) => Return | Promise<Return>} fn - The function to wrap. Must take a single record argument.
 * @param {InteractionSpanOptions} [options] - Optional span-specific options.
 * @returns {(arg: Arg) => Return | Promise<Return>} - The wrapped function with the identical type signature.
 */
export function interaction<Arg extends Record<string, any>, Return>(
  pipelineId: string,
  fn: (arg: Arg) => Return | Promise<Return>,
  options: InteractionSpanOptions = {},
): (arg: Arg) => Return | Promise<Return> {
  // Return the identical function type
  const tracer = trace.getTracer('gentrace-sdk');

  // Attempt to get function name, fall back safely
  const fnName = typeof fn === 'function' ? (fn as any).name : '';
  const interactionName = options?.name || fnName || 'anonymousInteraction';

  const wrappedFn = (arg: Arg): Return | Promise<Return> => {
    return tracer.startActiveSpan(interactionName, (span: Span) => {
      span.setAttribute('gentrace.pipeline_id', pipelineId);

      try {
        span.addEvent('gentrace.fn.args', {
          args: stringify(arg),
        });

        const result = fn(arg);

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

  return wrappedFn;
}
