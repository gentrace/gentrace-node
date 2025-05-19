import { AsyncLocalStorage } from 'node:async_hooks';
import { finishExperiment, startExperiment, StartExperimentParams } from './experiment-control';
import { checkOtelConfigAndWarn } from './otel';

/**
 * Represents the context for an experiment run. This context is stored in
 * AsyncLocalStorage to make the experiment ID and pipeline ID available throughout
 * the asynchronous execution flow.
 */
export type ExperimentContext = {
  /**
   * The unique identifier for the current experiment.
   */
  experimentId: string;

  /**
   * The ID of the pipeline associated with the experiment.
   */
  pipelineId: string;
};

// Create an AsyncLocalStorage instance for experiment context
// Export for testing purposes
export const experimentContextStorage = new AsyncLocalStorage<ExperimentContext>();

/**
 * Retrieves the experiment ID from the current asynchronous context, if any.
 * @returns The current experiment ID or undefined if not within an experiment() context.
 */
export function getCurrentExperimentContext(): ExperimentContext | undefined {
  return experimentContextStorage.getStore();
}

/**
 * Optional parameters for running an experiment.
 *
 * @typedef {Object} ExperimentOptions
 * @property {Record<string, any>} [metadata] - Optional metadata to associate with the experiment.
 * @property {any} [key: string] - Allows for additional arbitrary properties.
 */
export type ExperimentOptions = {
  metadata?: Record<string, any>;
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
  // Check if OpenTelemetry is properly configured
  checkOtelConfigAndWarn();
  
  let callbackResult: T | undefined;

  const metadata = options?.metadata;
  const startParams: StartExperimentParams = metadata ? { pipelineId, metadata } : { pipelineId };

  const experimentId = await startExperiment(startParams);

  await experimentContextStorage.run({ experimentId, pipelineId }, async () => {
    callbackResult = await callback();
  });

  await finishExperiment({ id: experimentId });

  return callbackResult as T;
}
