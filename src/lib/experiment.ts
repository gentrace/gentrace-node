import { AsyncLocalStorage } from 'node:async_hooks';
import { finishExperiment, startExperiment, StartExperimentParams } from './experiment-control';
import { checkOtelConfigAndWarn } from './otel';

/**
 * Represents the context for an experiment run. This context is stored in
 * AsyncLocalStorage to be accessible throughout the experiment's execution.
 */
export interface ExperimentContext {
  experimentId: string;
  pipelineId?: string | undefined;
  pipelineRunId?: string | undefined;
}

// Create an AsyncLocalStorage instance for experiment context
// Export for testing purposes
export const experimentContextStorage = new AsyncLocalStorage<ExperimentContext>();

/**
 * Gets the current experiment context from AsyncLocalStorage.
 * Returns undefined if called outside of an experiment.
 *
 * @returns The current experiment context or undefined if not in an experiment.
 */
export function getCurrentExperimentContext(): ExperimentContext | undefined {
  return experimentContextStorage.getStore();
}

/**
 * Options for configuring an experiment run.
 */
export interface ExperimentOptions {
  /**
   * Optional metadata to associate with the experiment.
   */
  metadata?: Record<string, unknown> | undefined;

  /**
   * The ID of the pipeline to associate with the experiment.
   */
  pipelineId?: string | undefined;
}

/**
 * Runs an experiment: starts it, executes the callback within an async context
 * containing the experiment ID, and finishes the experiment.
 *
 * @param pipelineIdOrCallback - Either the pipeline ID or the callback function
 * @param callbackOrOptions - Either the callback function or options
 * @param optionsOrUndefined - Optional parameters for the experiment run
 * @returns A promise that resolves with the result of the callback function
 */
export async function experiment<T>(
  pipelineIdOrCallback: string | (() => T | Promise<T>),
  callbackOrOptions?: (() => T | Promise<T>) | ExperimentOptions,
  optionsOrUndefined?: ExperimentOptions,
): Promise<T> {
  // Handle different parameter combinations for backward compatibility
  let pipelineId: string | undefined;
  let callback: () => T | Promise<T>;
  let options: ExperimentOptions | undefined;

  if (typeof pipelineIdOrCallback === 'string') {
    // Old signature: experiment(pipelineId, callback, options?)
    pipelineId = pipelineIdOrCallback;
    callback = callbackOrOptions as () => T | Promise<T>;
    options = optionsOrUndefined;
  } else {
    // New signature: experiment(callback, options?)
    callback = pipelineIdOrCallback;
    options = callbackOrOptions as ExperimentOptions | undefined;
    pipelineId = options?.pipelineId;
  }

  // Check if OpenTelemetry is properly configured
  checkOtelConfigAndWarn();

  let callbackResult: T | undefined;

  const metadata = options?.metadata;
  const startParams: StartExperimentParams = metadata ? { pipelineId, metadata } : { pipelineId };

  const experimentId = await startExperiment(startParams);

  try {
    // Create the experiment context
    const experimentContext: ExperimentContext = {
      experimentId,
      pipelineId,
    };

    // Run the callback within the experiment context
    callbackResult = await experimentContextStorage.run(experimentContext, async () => {
      return await Promise.resolve(callback());
    });

    // Finish the experiment with success
    await finishExperiment({ id: experimentId });
  } catch (error) {
    // If an error occurs, finish the experiment with the error
    try {
      await finishExperiment({ id: experimentId, error: error as Error });
    } catch (finishError) {
      // Ignore errors from finishExperiment to ensure the original error is thrown
      console.error('Failed to finish experiment:', finishError);
    }
    throw error;
  }

  return callbackResult as T;
}
