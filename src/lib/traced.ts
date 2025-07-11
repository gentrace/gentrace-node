import { SpanStatusCode, trace } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { ATTR_GENTRACE_FN_ARGS, ATTR_GENTRACE_FN_OUTPUT } from './otel/constants';
import { checkOtelConfigAndWarn } from './utils';

/**
 * Configuration options for the behavior of the traced function.
 * (Excludes name, as it's a top-level parameter for `traced`)
 */
export type TracedConfig = {
  /**
   * Additional attributes to set on the span.
   */
  attributes?: Record<string, any>;
};

/**
 * Wraps a function with OpenTelemetry tracing to track its execution.
 * Creates a span for the function execution and records its success or failure.
 *
 * @template {function} F - The type of the function to wrap with tracing.
 * @param {string} name - Required name for the span.
 * @param {F} fn - The function to wrap with tracing.
 * @param {TracedConfig} [config] - Optional configuration for tracing.
 * @returns {F} A new function that has the same parameters and return type as fn.
 */
export function traced<F extends (...args: any[]) => any>(name: string, fn: F, config?: TracedConfig): F {
  const tracer = trace.getTracer('gentrace');
  const fnName = fn.name;
  const spanName = name;
  const attributes = config?.attributes;

  const wrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    checkOtelConfigAndWarn();
    const resultPromise = tracer.startActiveSpan(spanName, (span) => {
      Object.entries(attributes ?? {}).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });

      try {
        const argsString = stringify(args);
        span.addEvent(ATTR_GENTRACE_FN_ARGS, { args: argsString });

        const result = fn(...args);

        if (result instanceof Promise) {
          return result
            .then((finalOutput) => {
              const outputString = stringify(finalOutput);
              span.addEvent(ATTR_GENTRACE_FN_OUTPUT, { output: outputString });
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
          span.addEvent(ATTR_GENTRACE_FN_OUTPUT, { output: outputString });
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
  if (fnName) {
    Object.defineProperty(wrappedFn, 'name', { value: fnName, configurable: true });
  }

  return wrappedFn as F;
}
