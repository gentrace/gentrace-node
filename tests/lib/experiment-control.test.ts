import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StartExperimentParams } from '../../src/lib/experiment-control';

interface MockExperiment {
  id: string;
}

const mockGentraceClient = {
  experiments: {
    create: jest.fn<() => Promise<MockExperiment>>(),
    update: jest.fn<() => Promise<{}>>(),
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
};

describe('experiment-control', () => {
  const params: StartExperimentParams = {
    pipelineId: 'test-pipeline',
    metadata: { test: 'metadata' },
  };
  const mockExperiment = { id: 'exp-123' };

  let experimentControlLib: typeof import('../../src/lib/experiment-control');
  let clientInstanceLib: typeof import('../../src/lib/client-instance');
  let mockedGetClient: jest.Mock;
  let processOnSpy: any;
  let processRemoveListenerSpy: any;

  beforeEach((done) => {
    jest.isolateModules(() => {
      jest.doMock('../../src/lib/client-instance', () => ({
        _getClient: jest.fn(),
      }));

      clientInstanceLib = require('../../src/lib/client-instance');
      experimentControlLib = require('../../src/lib/experiment-control');

      processOnSpy = jest.spyOn(process, 'on');
      processRemoveListenerSpy = jest.spyOn(process, 'removeListener');

      mockedGetClient = clientInstanceLib._getClient as jest.Mock;
      mockedGetClient.mockReturnValue(mockGentraceClient);

      jest.clearAllMocks();

      mockedGetClient.mockReturnValue(mockGentraceClient);

      done();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startExperiment', () => {
    it('should call client.experiments.create with correct parameters', async () => {
      mockGentraceClient.experiments.create.mockResolvedValue(mockExperiment);
      await experimentControlLib.startExperiment(params);
      expect(mockGentraceClient.experiments.create).toHaveBeenCalledWith({
        pipelineId: params.pipelineId,
        metadata: params.metadata,
      });
    });

    it('should return the experiment ID on successful creation', async () => {
      mockGentraceClient.experiments.create.mockResolvedValue(mockExperiment);
      const experimentId = await experimentControlLib.startExperiment(params);
      expect(experimentId).toBe(mockExperiment.id);
    });

    it('should register shutdown listeners for SIGINT and SIGTERM', async () => {
      mockGentraceClient.experiments.create.mockResolvedValue(mockExperiment);
      await experimentControlLib.startExperiment(params);

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should log info on successful start', async () => {
      mockGentraceClient.experiments.create.mockResolvedValue(mockExperiment);
      await experimentControlLib.startExperiment(params);
      expect(mockGentraceClient.logger.info).toHaveBeenCalledWith(
        `Started experiment ${mockExperiment.id} for pipeline ${params.pipelineId}`,
      );
    });

    it('should throw and log error if client.experiments.create fails', async () => {
      const error = new Error('Failed to create');
      mockGentraceClient.experiments.create.mockRejectedValue(error);
      await expect(experimentControlLib.startExperiment(params)).rejects.toThrow(error);
      expect(mockGentraceClient.logger.error).toHaveBeenCalledWith(`Failed to start experiment: ${error}`);
    });
  });

  describe('finishExperiment', () => {
    const experimentId = 'exp-123';

    async function simulateStartExperiment(id: string) {
      mockGentraceClient.experiments.create.mockResolvedValue({ id });
      await experimentControlLib.startExperiment({ pipelineId: 'simulated-pipeline' });
      mockGentraceClient.experiments.create.mockClear();
      mockGentraceClient.logger.info.mockClear();
      processOnSpy.mockClear(); // Clear spy calls specific to this setup
    }

    it('should call client.experiments.update with EVALUATING status on success', async () => {
      await simulateStartExperiment(experimentId);
      mockGentraceClient.experiments.update.mockResolvedValue({});

      await experimentControlLib.finishExperiment({ id: experimentId });
      expect(mockGentraceClient.experiments.update).toHaveBeenCalledWith(experimentId, {
        status: 'EVALUATING',
      });
    });

    it('should call client.experiments.update with EVALUATING status and error message on error', async () => {
      await simulateStartExperiment(experimentId);
      const error = new Error('Test error');
      mockGentraceClient.experiments.update.mockResolvedValue({});

      await experimentControlLib.finishExperiment({ id: experimentId, error: error });
      expect(mockGentraceClient.experiments.update).toHaveBeenCalledWith(experimentId, {
        status: 'EVALUATING',
        errorMessage: error.message,
      });
    });

    it('should handle error as string', async () => {
      await simulateStartExperiment(experimentId);
      const errorMsg = 'Test error string';
      mockGentraceClient.experiments.update.mockResolvedValue({});

      await experimentControlLib.finishExperiment({ id: experimentId, error: errorMsg });
      expect(mockGentraceClient.experiments.update).toHaveBeenCalledWith(experimentId, {
        status: 'EVALUATING',
        errorMessage: errorMsg,
      });
    });

    it('should remove shutdown listeners', async () => {
      await simulateStartExperiment(experimentId);
      mockGentraceClient.experiments.update.mockResolvedValue({});
      await experimentControlLib.finishExperiment({ id: experimentId });

      expect(processRemoveListenerSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processRemoveListenerSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should log info on successful finish', async () => {
      await simulateStartExperiment(experimentId);
      mockGentraceClient.experiments.update.mockResolvedValue({});

      await experimentControlLib.finishExperiment({ id: experimentId });
      expect(mockGentraceClient.logger.info).toHaveBeenCalledWith(
        `Finished experiment ${experimentId} with status: success`,
      );
    });

    it('should log info on finish with error', async () => {
      await simulateStartExperiment(experimentId);
      const error = new Error('Finish error');
      mockGentraceClient.experiments.update.mockResolvedValue({});

      await experimentControlLib.finishExperiment({ id: experimentId, error });
      expect(mockGentraceClient.logger.info).toHaveBeenCalledWith(
        `Finished experiment ${experimentId} with status: error`,
      );
    });

    it('should log error if client.experiments.update fails', async () => {
      await simulateStartExperiment(experimentId);
      const updateError = new Error('Failed to update');
      mockGentraceClient.experiments.update.mockRejectedValue(updateError);
      try {
        await experimentControlLib.finishExperiment({ id: experimentId });
      } catch (e) {}
      expect(mockGentraceClient.logger.error).toHaveBeenCalledWith(
        `Failed to finish experiment ${experimentId} via API:`,
      );
    });

    it('should warn and return if experiment ID is not active', async () => {
      const loggerWarnSpy = jest.spyOn(mockGentraceClient.logger, 'warn');

      try {
        await experimentControlLib.finishExperiment({ id: 'non-existent-id' });

        expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Attempted to finish experiment non-existent-id, but it was not found in the active list.',
        );
        expect(mockGentraceClient.experiments.update).not.toHaveBeenCalled();
        expect(processRemoveListenerSpy).not.toHaveBeenCalled();
      } finally {
        loggerWarnSpy.mockRestore();
      }
    });

    it('shutdown listener should call finishExperimentInternal with error', async () => {
      mockGentraceClient.experiments.create.mockResolvedValue(mockExperiment);
      await experimentControlLib.startExperiment(params);

      const sigintCall = processOnSpy.mock.calls.find((call: any[]) => call[0] === 'SIGINT');
      const listener = sigintCall ? (sigintCall[1] as NodeJS.SignalsListener) : undefined;
      expect(listener).toBeDefined();

      mockGentraceClient.experiments.update.mockResolvedValue({});
      if (listener) {
        await listener('SIGINT');
      }

      expect(mockGentraceClient.experiments.update).toHaveBeenCalledWith(mockExperiment.id, {
        status: 'EVALUATING',
        errorMessage: 'Process terminated with signal SIGINT',
      });
      expect(processRemoveListenerSpy).toHaveBeenCalledWith('SIGINT', listener);
    });
  });
});
