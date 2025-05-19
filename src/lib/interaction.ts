import { context, propagation } from '@opentelemetry/api';
import { ANONYMOUS_SPAN_NAME } from './constants';
import { TracedOptions, traced } from './traced';
import { checkOtelConfigAndWarn } from './otel';

/**
 * Wraps a function with OpenTelemetry tracing to track interactions within a pipeline.
 *
 * @param pipelineIdOrOptions - Either the pipeline ID or options for the traced function
 * @param fnOrUndefined - The function to wrap (if using the old signature)
 * @param optionsOrUndefined - Options for the traced function (if using the old signature)
 * @returns A decorator function or the wrapped function
 */
export function interaction<F extends (...args: any[]) => any>(
  pipelineIdOrOptions: string | TracedOptions = {},
  fnOrUndefined?: F,
  optionsOrUndefined?: TracedOptions,
): ((target: F) => F) | F {
  // Handle different parameter combinations for backward compatibility
  let pipelineId: string | undefined;
  let fn: F | undefined = fnOrUndefined;
  let options: TracedOptions = {};

  if (typeof pipelineIdOrOptions === 'string') {
    // Old signature: interaction(pipelineId, fn, options?)
    pipelineId = pipelineIdOrOptions;
    options = optionsOrUndefined || {};
    options.pipelineId = pipelineId;

    if (fn) {
      return wrapFunction(fn, options);
    }
  } else {
    // New signature: interaction(options)(fn)
    options = pipelineIdOrOptions;
  }

  // Return a decorator function
  return (target: F): F => {
    return wrapFunction(target, options);
  };
}

/**
 * Internal function to wrap a function with tracing
 */
function wrapFunction<F extends (...args: any[]) => any>(fn: F, options: TracedOptions): F {
  const fnName = fn.name;
  const interactionName = options?.name || fnName || ANONYMOUS_SPAN_NAME;

  const wrappedFn = traced(fn, {
    name: interactionName,
    attributes: {
      ...options.attributes,
      'gentrace.pipeline_id': options.pipelineId || '',
    },
  });

  const finalWrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    // Check if OpenTelemetry is properly configured
    checkOtelConfigAndWarn();

    // Skip context propagation in tests or if context.bind is not available
    try {
      const currentContext = context.active();
      const currentBaggage = propagation.getBaggage(currentContext) ?? propagation.createBaggage();

      const newBaggage = currentBaggage.setEntry('gentrace.sample', {
        value: 'true',
      });
      const newContext = propagation.setBaggage(currentContext, newBaggage);

      // Check if context.bind is available (it might not be in tests)
      if (typeof context.bind === 'function') {
        return context.bind(newContext, wrappedFn)(...args);
      }
    } catch (e) {
      // Silently continue if context operations fail
    }

    // Fallback to direct function call
    return wrappedFn(...args);
  };

  return finalWrappedFn as F;
}
