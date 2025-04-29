import { trace, SpanStatusCode, Span } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { AnonymousSpanName } from './constants';

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
 * Preserves the exact type signature of the original function.
 *
 * @param pipelineId The ID of the pipeline this interaction belongs to.
 * @param fn The function to wrap. Must take zero args or a single record argument.
 * @param options Optional span-specific options.
 * @returns The wrapped function with the identical type signature.
 */

// Overload 1: Zero-arg async function
export function interaction<Return>(
  pipelineId: string,
  fn: () => Promise<Return>,
  options?: InteractionSpanOptions,
): () => Promise<Return>;

// Overload 2: Zero-arg sync function
export function interaction<Return>(
  pipelineId: string,
  fn: () => Return,
  options?: InteractionSpanOptions,
): () => Return;

// Overload 3: One-arg async function
export function interaction<Arg extends Record<string, any>, Return>(
  pipelineId: string,
  fn: (arg: Arg) => Promise<Return>,
  options?: InteractionSpanOptions,
): (arg: Arg) => Promise<Return>;

// Overload 4: One-arg sync function
export function interaction<Arg extends Record<string, any>, Return>(
  pipelineId: string,
  fn: (arg: Arg) => Return,
  options?: InteractionSpanOptions,
): (arg: Arg) => Return;

export function interaction(
  pipelineId: string,
  fn: Function, // Implementation signature uses Function type
  options: InteractionSpanOptions = {},
): Function {
  // Implementation signature uses Function type
  const tracer = trace.getTracer('gentrace-sdk');

  const fnName = typeof fn === 'function' ? fn.name : '';
  const interactionName = options?.name || fnName || AnonymousSpanName.INTERACTION;

  const wrappedFn = (...args: any[]): any => {
    // Accept variable args
    return tracer.startActiveSpan(interactionName, (span: Span) => {
      span.setAttribute('gentrace.pipeline_id', pipelineId);

      try {
        // Log arguments based on whether they exist
        const argsToLog = args.length > 0 ? [args[0]] : [];
        span.addEvent('gentrace.fn.args', {
          args: stringify(argsToLog),
        });

        // Call the original function with appropriate arguments
        const result = fn(...args); // Spread operator handles both 0 and 1 arg cases

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

  return wrappedFn;
}
