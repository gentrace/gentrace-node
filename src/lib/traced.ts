import { SpanStatusCode, trace } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { AnonymousSpanName } from './constants';

/**
 * Options for configuring the behavior of the traced function.
 */
interface TracedOptions {
  /**
   * Optional custom name for the span.
   * Defaults to the function's name or 'anonymousFunction'.
   */
  name?: string;
}

/**
 * Wraps a function with OpenTelemetry tracing to track its execution.
 * Creates a span for the function execution and records its success or failure.
 *
 * @template TArgs - The types of the arguments the function takes.
 * @template TResult - The return type of the function.
 * @param {(...args: TArgs) => Promise<TResult> | TResult} fn - The function to wrap with tracing.
 */
export function traced<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult> | TResult,
  options?: TracedOptions,
): (...args: TArgs) => Promise<TResult> {
  const tracer = trace.getTracer('gentrace');
  const spanName = options?.name || fn.name || AnonymousSpanName.FUNCTION;

  return async (...args: TArgs): Promise<TResult> => {
    return tracer.startActiveSpan(spanName, async (span) => {
      try {
        const argsString = stringify(args);
        span.addEvent('gentrace.fn.args', { args: argsString });

        const result = await fn(...args);

        const outputString = stringify(result);
        span.addEvent('gentrace.fn.output', { output: outputString });
        span.end();

        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.setAttribute('error.type', error.name);
        span.end();
        throw error;
      }
    });
  };
}
