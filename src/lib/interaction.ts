import { context, propagation } from '@opentelemetry/api';
import { ANONYMOUS_SPAN_NAME } from './constants';
import { TracedOptions, traced } from './traced';
import { checkOtelConfigAndWarn } from './otel';

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
  options: TracedOptions = {
    name: fn.name || ANONYMOUS_SPAN_NAME,
    attributes: {
      'gentrace.pipeline_id': pipelineId,
    },
  },
): F {
  const fnName = fn.name;
  const interactionName = options?.name || fnName || ANONYMOUS_SPAN_NAME;

  const wrappedFn = traced(fn, {
    name: interactionName,
    attributes: {
      ...options.attributes,
      'gentrace.pipeline_id': pipelineId,
    },
  });

  const finalWrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    // Check if OpenTelemetry is properly configured
    checkOtelConfigAndWarn();
    
    const currentContext = context.active();
    const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

    const newBaggage = currentBaggage.setEntry('gentrace.sample', {
      value: 'true',
    });
    const newContext = propagation.setBaggage(currentContext, newBaggage);
    return context.bind(newContext, wrappedFn)(...args);
  };

  return finalWrappedFn as F;
}
