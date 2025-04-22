import { AsyncLocalStorage } from 'node:async_hooks';
import { _getClient } from './client-instance';
import { finishExperiment, startExperiment, StartExperimentParams } from './experiment-control';
import { GentraceState } from './state';

/**
 * Represents the context for an experiment run. This context is stored in
 * AsyncLocalStorage to make the experiment ID and pipeline ID available throughout
 * the asynchronous execution flow.
 */
export interface ExperimentContext {
  /**
   * The unique identifier for the current experiment.
   */
  experimentId: string;

  /**
   * The ID of the pipeline associated with the experiment.
   */
  pipelineId: string;
}

// Create an AsyncLocalStorage instance for experiment context
// Export for testing purposes
export const experimentContextStorage = new AsyncLocalStorage<ExperimentContext>();

/**
 * Retrieves the experiment ID from the current asynchronous context, if any.
 * @returns The current experiment ID or undefined if not within a runExperiment context.
 */
export function getCurrentExperimentContext(): ExperimentContext | undefined {
  return experimentContextStorage.getStore();
}

/**
 * Optional parameters for running an experiment.
 *
 * @typedef {Object} ExperimentOptions
 * @property {ExperimentMetadata} [metadata] - Optional metadata to associate with the experiment.
 * @property {any} [key: string] - Allows for additional arbitrary properties.
 */
/**
 * Optional parameters for running an experiment.
 */
export type ExperimentOptions = {
  metadata?: Record<string, any>;
  state?: GentraceState;
};

/**
 * Runs an experiment: starts it, executes the callback within an async context
 * containing the experiment ID, and finishes the experiment.
 *
 * @param {string} pipelineId - The ID of the pipeline to associate with the experiment.
 * @param {() => T | Promise<T>} callback - The function containing the experiment logic, returning type T.
 * @param {ExperimentOptions} [options] - Optional parameters for the experiment run, including metadata.
 * @returns A promise that resolves with the result of the callback function (type T).
 */
export async function experiment<T>(
  pipelineId: string,
  callback: () => T | Promise<T>,
  options?: ExperimentOptions,
): Promise<T> {
  const state = options?.state ?? GentraceState.getActiveState();

  if (!state) {
    throw new Error(
      'Gentrace state is not initialized. Please call init() or pass a GentraceState instance in the options.',
    );
  }

  // The overall function needs to return the result of the callback
  let callbackResult: T | undefined;

  await state.runWith(async () => {
    const client = _getClient();
    let experimentId: string | undefined;
    const metadata = options?.metadata;
    const startParams: StartExperimentParams = metadata ? { pipelineId, metadata } : { pipelineId };

    try {
      experimentId = await startExperiment(startParams);

      await experimentContextStorage.run({ experimentId, pipelineId }, async () => {
        // Store the callback result
        callbackResult = await callback();
      });

      await finishExperiment({ id: experimentId });
    } catch (error) {
      client.logger?.error('Error during experiment run:', error);
      if (experimentId) {
        try {
          await finishExperiment({
            id: experimentId,
            error: error instanceof Error ? error : String(error),
          });
        } catch (finishError) {
          client.logger?.error('Failed to finish experiment with error status:', finishError);
        }
      }
      throw error;
    }
  });

  // Return the stored result (cast needed as it might technically be undefined if runWith fails before callback)
  return callbackResult as T;
}
