import { context, propagation } from '@opentelemetry/api';

import { ATTR_GENTRACE_PIPELINE_ID, ATTR_GENTRACE_SAMPLE } from './otel/constants';
import { traced } from './traced';

/**
 * Options for configuring the interaction function.
 */
export type InteractionOptions = {
  /**
   * The ID of the pipeline this interaction belongs to.
   */
  pipelineId: string;

  /**
   * Additional attributes to set on the span.
   */
  attributes?: Record<string, any>;
};

/**
 * Wraps a function with OpenTelemetry tracing to track interactions within a pipeline.
 * Creates a span for the function execution and records its success or failure.
 * Handles functions that take either zero arguments or one argument which is a record.
 * Preserves the exact type signature (including sync/async return type) of the original function.
 *
 * @template {function} F - The type of the function to wrap.
 * @param {string} name - The name for the span.
 * @param {F} fn - The function to wrap. Must take zero args or a single record argument.
 * @param {InteractionOptions} options - Configuration options including pipelineId and additional attributes.
 * @returns {F} The wrapped function with the identical type signature as fn.
 */
export function interaction<F extends (...args: any[]) => any>(
  name: string,
  fn: F,
  options: InteractionOptions,
): F {
  const { pipelineId, attributes } = options;

  const wrappedFn = traced(fn, {
    name: name,
    attributes: {
      ...attributes,
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
