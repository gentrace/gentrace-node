import { _getClient } from './client-instance';

export type ExperimentMetadata = Record<string, unknown>;

interface ActiveExperiment {
  id: string;
  pipelineId: string;
  shutdownListener: NodeJS.SignalsListener;
}

const activeExperiments = new Map<string, ActiveExperiment>();

/**
 * Input parameters for starting an experiment.
 */
export type StartExperimentParams = {
  pipelineId: string;
  metadata?: ExperimentMetadata;
};

/**
 * Starts a new experiment run by creating an experiment record via the Gentrace API.
 * Registers a listener to attempt finishing the experiment if the process exits unexpectedly.
 * Requires Gentrace client to be configured (e.g., via environment variables).
 *
 * @param {StartExperimentParams} params - The parameters for starting the experiment.
 * @param {string} params.pipelineId - The ID of the pipeline the experiment belongs to.
 * @param {ExperimentMetadata} [params.metadata] - Optional metadata to associate with the experiment run.
 * @returns A promise that resolves with the unique ID of the created experiment run.
 */
export async function startExperiment({ pipelineId, metadata }: StartExperimentParams): Promise<string> {
  const client = _getClient();

  const experiment = await client.experiments.create({
    pipelineId,
    ...(metadata && { metadata }),
  });

  const experimentId = experiment.id;

  const shutdownListener: NodeJS.SignalsListener = async (signal) => {
    await _finishExperiment(experimentId, {
      status: 'error',
      error: `Process terminated with signal ${signal}`,
    });
  };

  // Store experiment info and listener
  activeExperiments.set(experimentId, {
    id: experimentId,
    pipelineId: pipelineId,
    shutdownListener: shutdownListener,
  });

  process.on('SIGINT', shutdownListener);
  process.on('SIGTERM', shutdownListener);

  client.logger?.info(`Started experiment ${experimentId} for pipeline ${pipelineId}`);
  return experimentId;
}

/**
 * Input parameters for finishing an experiment.
 */
export type FinishExperimentParams = {
  id: string;
  error?: Error | string;
};

/**
 * Finishes an experiment run by updating its status via the Gentrace API.
 * Removes the shutdown listener associated with the experiment.
 *
 * @param {FinishExperimentParams} params - The parameters for finishing the experiment.
 * @param {string} params.id - The ID of the experiment run to finish.
 * @param {Error | string} [params.error] - Optional error to record for the experiment.
 */
export async function finishExperiment({ id, error }: FinishExperimentParams): Promise<void> {
  const result =
    error ?
      { status: 'error' as const, error: error instanceof Error ? error.message : error }
    : { status: 'success' as const };

  await _finishExperiment(id, result);
}

/**
 * Internal function to handle finishing the experiment, allowing status/error override.
 */
async function _finishExperiment(
  id: string,
  result: { status: 'success' } | { status: 'error'; error: string },
): Promise<void> {
  const client = _getClient();
  const activeExperiment = activeExperiments.get(id);

  if (!activeExperiment) {
    // This shouldn't happen. Experiment already finished or never started tracking.
    client.logger?.warn(`Attempted to finish experiment ${id}, but it was not found in the active list.`);
    throw new Error(`Experiment ${id} not found in active experiments list.`);
  }

  process.removeListener('SIGINT', activeExperiment.shutdownListener);
  process.removeListener('SIGTERM', activeExperiment.shutdownListener);

  activeExperiments.delete(id);

  await client.experiments.update(id, {
    status: 'EVALUATING',
    ...(result.status === 'error' && { errorMessage: result.error }),
  });
}
