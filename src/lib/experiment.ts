import { AsyncLocalStorage } from 'node:async_hooks';
import { finishExperiment, startExperiment, StartExperimentParams } from './experiment-control';
import type { Experiment } from '../resources/experiments';
import { _getClient } from './client-instance';
import { isValidUUID } from './utils';

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
 * @property {string} [pipelineId] - The ID of the pipeline to associate with the experiment. Defaults to 'default'.
 * @property {any} [key: string] - Allows for additional arbitrary properties.
 */
export type ExperimentOptions = {
  metadata?: Record<string, any>;
  pipelineId?: string;
};

/**
 * The result of an experiment run.
 */
export type ExperimentResult = Experiment & { url: string };

/**
 * Runs an experiment: starts it, executes the callback within an async context
 * containing the experiment ID, and finishes the experiment.
 *
 * @param {() => T | Promise<T>} callback - The function containing the experiment logic, returning type T.
 * @param {ExperimentOptions} [options] - Optional parameters for the experiment run, including metadata and pipelineId.
 * @returns A promise that resolves with the experiment object.
 */
export async function experiment<T>(
  callback: () => T | Promise<T>,
  options?: ExperimentOptions,
): Promise<Experiment & { url: string }> {
  // Use 'default' if no pipelineId is provided
  const pipelineId = options?.pipelineId ?? 'default';
  const metadata = options?.metadata;

  // Validate UUID format (skip validation for 'default')
  if (pipelineId !== 'default' && !isValidUUID(pipelineId)) {
    throw new Error(`Invalid pipelineId: '${pipelineId}'. Must be a valid UUID.`);
  }

  const startParams: StartExperimentParams = metadata ? { pipelineId, metadata } : { pipelineId };

  const result = await startExperiment(startParams);
  const experimentId = result.id;

  await experimentContextStorage.run({ experimentId, pipelineId }, async () => {
    await callback();
  });

  await finishExperiment({ id: experimentId });

  const client = _getClient();
  const url = new URL(client.baseURL);
  const hostname = `${url.protocol}//${url.host}`;
  return { ...result, url: `${hostname}${result.resourcePath}` };
}
