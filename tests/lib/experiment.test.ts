import { jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import {
  experiment,
  ExperimentContext,
  ExperimentOptions,
  getCurrentExperimentContext,
} from '../../src/lib/experiment';
import { server } from '../mocks/server';

import { experimentContextStorage } from '../../src/lib/experiment';
import { init } from '../../src/lib/init';

describe('experiment', () => {
  const mockExperimentId = 'exp-msw-123';
  const mockPipelineId = 'pipe-123';

  beforeEach(() => {
    jest.clearAllMocks();

    init({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    });
  });

  it('should start experiment, run callback, and finish experiment successfully', async () => {
    const metadata = { key: 'value' };
    const options: ExperimentOptions = { metadata };

    const runSpy = jest.spyOn(experimentContextStorage, 'run');

    const callback = jest.fn<() => Promise<string>>(async () => {
      const context = getCurrentExperimentContext();
      expect(context).toEqual({ experimentId: mockExperimentId, pipelineId: mockPipelineId });
      return 'Callback Result';
    });

    const result = await experiment(mockPipelineId, callback, options);

    expect(result).toBe('Callback Result');
    expect(callback).toHaveBeenCalledTimes(1);

    expect(runSpy).toHaveBeenCalledWith(
      { experimentId: mockExperimentId, pipelineId: mockPipelineId },
      expect.any(Function),
    );

    runSpy.mockRestore();
  });

  it('should work without metadata', async () => {
    const callback = jest.fn<() => void>();
    await experiment(mockPipelineId, callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should finish experiment even if callback throws (async)', async () => {
    const error = new Error('Callback failed');
    const callback = jest.fn<() => Promise<void>>(async () => {
      throw error;
    });
    await expect(experiment(mockPipelineId, callback)).rejects.toThrow(error);
  });

  it('should finish experiment even if callback throws (sync)', async () => {
    const error = new Error('Callback failed sync');
    const callback = jest.fn<() => void>(() => {
      throw error;
    });
    await expect(experiment(mockPipelineId, callback)).rejects.toThrow(error);
  });

  it('should handle error during startExperiment', async () => {
    server.use(
      http.post('https://gentrace.ai/api/v4/experiments', () => {
        return new HttpResponse('Internal Server Error', { status: 500 });
      }),
    );
    const callback = jest.fn<() => void>();
    await expect(experiment(mockPipelineId, callback)).rejects.toThrow();
    expect(callback).not.toHaveBeenCalled();
    expect(getCurrentExperimentContext()).toBeUndefined();
  });

  it('should attempt finishExperiment even if finishExperiment fails', async () => {
    const callbackError = new Error('Callback failed');
    const callback = jest.fn<() => Promise<void>>(async () => {
      throw callbackError;
    });

    server.use(
      http.post('https://gentrace.ai/api/v4/experiments/:id', () => {
        return new HttpResponse('Finish Failed', { status: 500 });
      }),
    );

    await expect(experiment(mockPipelineId, callback)).rejects.toThrow(callbackError);
  });

  describe('getCurrentExperimentContext', () => {
    it('should return undefined outside of an experiment run', () => {
      expect(getCurrentExperimentContext()).toBeUndefined();
    });

    it('should return the context within an experiment run (using real ALS)', async () => {
      const context = { experimentId: mockExperimentId, pipelineId: mockPipelineId };
      const callback = jest.fn<() => void>(() => {
        expect(getCurrentExperimentContext()).toEqual(context);
      });

      await experiment(mockPipelineId, callback);

      expect(callback).toHaveBeenCalled();
      expect(getCurrentExperimentContext()).toBeUndefined();
    });
  });
});
