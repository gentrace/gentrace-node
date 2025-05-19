import { SpanStatusCode, trace } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { ANONYMOUS_SPAN_NAME } from './constants';
import { checkOtelConfigAndWarn } from './otel';

/**
 * Options for configuring the behavior of the traced function.
 */
export interface TracedOptions {
  /**
   * The name to use for the span. Defaults to the function name or 'anonymous-span'.
   */
  name?: string | undefined;

  /**
   * Additional attributes to add to the span.
   */
  attributes?: Record<string, string> | undefined;

  /**
   * The ID of the pipeline this function is part of.
   */
  pipelineId?: string | undefined;
}

/**
 * Wraps a function with OpenTelemetry tracing.
 *
 * @param fn - The function to wrap with tracing
 * @param options - Optional configuration for the traced function
 * @returns The wrapped function with the same signature as the original
 */
export function traced<F extends (...args: any[]) => any>(fn: F, options: TracedOptions = {}): F {
  const tracer = trace.getTracer('gentrace-sdk');
  const spanName = options.name || fn.name || ANONYMOUS_SPAN_NAME;
  const attributes = options.attributes;

  const wrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    // Check if OpenTelemetry is properly configured
    checkOtelConfigAndWarn();

    const resultPromise = tracer.startActiveSpan(spanName, (span) => {
      Object.entries(attributes ?? {}).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });

      try {
        const argsString = stringify(args);
        span.addEvent('gentrace.fn.args', { args: argsString });

        const result = fn(...args);

        if (result instanceof Promise) {
          return result
            .then((finalOutput) => {
              const outputString = stringify(finalOutput);
              span.addEvent('gentrace.fn.output', { output: outputString });
              span.end();
              return finalOutput;
            })
            .catch((error) => {
              span.recordException(error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
              span.setAttribute('error.type', error.name);
              span.end();
              throw error;
            });
        } else {
          const outputString = stringify(result);
          span.addEvent('gentrace.fn.output', { output: outputString });
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
    return resultPromise;
  };

  // Preserve the original function's name if possible
  if (fn.name) {
    Object.defineProperty(wrappedFn, 'name', { value: fn.name, configurable: true });
  }

  return wrappedFn as F;
}
