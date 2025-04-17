import { jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import {
  experiment,
  ExperimentContext,
  ExperimentOptions,
  getCurrentExperimentContext,
} from '../../src/lib/experiment';
import { GentraceState } from '../../src/lib/state';
import { server } from '../mocks/server';

class MockGentraceStateImpl {
  runWith = jest.fn(async (cb: () => any) => {
    return await cb();
  });
  getExperimentContext = jest.fn<() => ExperimentContext | undefined>();
  getClient = jest.fn(() => ({
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  }));
}

interface MockedStateModule {
  GentraceState: jest.Mock;
  _globalState: MockGentraceStateImpl;
  getActiveState: jest.Mock<() => MockGentraceStateImpl>;
}

jest.mock('../../src/lib/state', () => {
  const mockGlobalStateInstance = new MockGentraceStateImpl();

  return {
    GentraceState: jest.fn().mockImplementation(() => new MockGentraceStateImpl()),
    _globalState: mockGlobalStateInstance,
    getActiveState: jest.fn(() => mockGlobalStateInstance),
    getInternalClient: jest.fn(() => mockGlobalStateInstance.getClient()),
  };
});

import { experimentContextStorage } from '../../src/lib/experiment';
import { init } from '../../src/lib/init';

describe('experiment', () => {
  const mockExperimentId = 'exp-msw-123';
  const mockPipelineId = 'pipe-123';

  let mockGetActiveState: jest.Mock<() => MockGentraceStateImpl>;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockedState = jest.requireMock('../../src/lib/state') as MockedStateModule;
    mockGetActiveState = mockedState.getActiveState;
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

  it('should use provided GentraceState if available', async () => {
    const specificStateInstance = new MockGentraceStateImpl();
    const options: ExperimentOptions = { state: specificStateInstance as unknown as GentraceState };
    const callback = jest.fn<() => void>();
    await experiment(mockPipelineId, callback, options);
    expect(specificStateInstance.runWith).toHaveBeenCalledTimes(1);
  });

  it('should use global state if no specific state provided', async () => {
    const mockedState = jest.requireMock('../../src/lib/state') as MockedStateModule;
    const globalStateInstance = mockedState._globalState;
    const callback = jest.fn<() => void>();
    await experiment(mockPipelineId, callback);
    expect(callback).toHaveBeenCalledTimes(1);
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
