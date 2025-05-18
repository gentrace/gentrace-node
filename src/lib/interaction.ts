import { context, propagation } from '@opentelemetry/api';
import { ANONYMOUS_SPAN_NAME } from './constants';

import { ATTR_GENTRACE_PIPELINE_ID, ATTR_GENTRACE_SAMPLE } from './otel/constants';
import { TracedOptions, traced } from './traced';

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
      [ATTR_GENTRACE_PIPELINE_ID]: pipelineId,
    },
  },
): F {
  const fnName = fn.name;
  const interactionName = options?.name || fnName || ANONYMOUS_SPAN_NAME;

  const wrappedFn = traced(fn, {
    name: interactionName,
    attributes: {
      ...options.attributes,
      [ATTR_GENTRACE_PIPELINE_ID]: pipelineId,
    },
  });

  const finalWrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    const currentContext = context.active();
    const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

    const newBaggage = currentBaggage.setEntry(ATTR_GENTRACE_SAMPLE, {
      value: 'true',
    });
    const newContext = propagation.setBaggage(currentContext, newBaggage);
    return context.bind(newContext, wrappedFn)(...args);
  };

  return finalWrappedFn as F;
}
