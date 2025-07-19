import { context, propagation } from '@opentelemetry/api';

import { ATTR_GENTRACE_PIPELINE_ID, ATTR_GENTRACE_SAMPLE } from './otel/constants';
import { traced } from './traced';
import { isValidUUID, validatePipelineAccess, displayPipelineError, isOtelConfigured } from './utils';
import { _isGentraceInitialized } from './init-state';
import { init } from './init';
import { GentraceWarnings } from './warnings';
import { _isClientProperlyInitialized } from './client-instance';

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

  /**
   * If true, suppresses warnings for auto-initialization and pipeline validation.
   * Defaults to false.
   */
  suppressWarnings?: boolean;
};

// Flag to track if pipeline ID format warning has been issued
let _pipelineIdFormatWarningIssued = false;

// Flag to track if auto-initialization warning has been issued
let _autoInitWarningIssued = false;

/**
 * Wraps a function with OpenTelemetry tracing to track interactions within a pipeline.
 * Creates a span for the function execution and records its success or failure.
 * Handles functions that take either zero arguments or one argument which is a record.
 * Preserves the exact type signature (including sync/async return type) of the original function.
 *
 * If OpenTelemetry is not configured and Gentrace has not been initialized, this function
 * will automatically initialize Gentrace using the GENTRACE_API_KEY environment variable
 * (and optionally GENTRACE_BASE_URL if set). This enables zero-configuration usage
 * when environment variables are properly set.
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
  const { pipelineId, attributes, suppressWarnings = false } = options;

  // Validate UUID format
  if (!isValidUUID(pipelineId)) {
    if (!suppressWarnings && !_pipelineIdFormatWarningIssued) {
      _pipelineIdFormatWarningIssued = true;
      displayPipelineError(pipelineId, 'invalid-format');
    }
  } else {
    // Only validate pipeline access if client is properly initialized
    if (_isClientProperlyInitialized()) {
      // Asynchronously validate pipeline access (non-blocking)
      validatePipelineAccess(pipelineId, suppressWarnings).catch(() => {
        // Error is already logged in validatePipelineAccess
      });
    }
  }

  const wrappedFn = traced(name, fn, {
    attributes: {
      ...attributes,
      [ATTR_GENTRACE_PIPELINE_ID]: pipelineId,
    },
  });

  const finalWrappedFn = (...args: Parameters<F>): ReturnType<F> => {
    // Auto-initialize if OpenTelemetry hasn't been configured and Gentrace hasn't been initialized
    if (!isOtelConfigured() && !_isGentraceInitialized()) {
      // Check if API key is available in environment variables
      const apiKey = process.env['GENTRACE_API_KEY'];

      if (apiKey) {
        // Show auto-initialization warning once (unless suppressed)
        if (!suppressWarnings && !_autoInitWarningIssued) {
          _autoInitWarningIssued = true;
          const warning = GentraceWarnings.AutoInitializationWarning();
          warning.display();
        }

        // Initialize with environment variables
        init({
          apiKey,
          // Use other environment variables if available
          ...(process.env['GENTRACE_BASE_URL'] && { baseURL: process.env['GENTRACE_BASE_URL'] }),
        });
      }
    }

    // Check if client is properly initialized (has valid API key)
    if (!_isClientProperlyInitialized()) {
      const warning = GentraceWarnings.MissingApiKeyError();
      warning.display();
      throw new Error('Gentrace API key is missing or invalid.');
    }

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
