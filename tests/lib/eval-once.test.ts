import { jest } from '@jest/globals';
import type { Span } from '@opentelemetry/api';
import { init } from 'gentrace/lib/init';
import { ATTR_GENTRACE_EXPERIMENT_ID, ATTR_GENTRACE_FN_OUTPUT } from 'gentrace/lib/otel/constants';
import stringify from 'json-stringify-safe';

let lastMockSpan: Partial<Span> | null = null;
const mockSpan = {
  setAttribute: jest.fn<Span['setAttribute']>(),
  addEvent: jest.fn<Span['addEvent']>(),
  recordException: jest.fn<Span['recordException']>(),
  setStatus: jest.fn<Span['setStatus']>(),
  end: jest.fn<Span['end']>(),
  mockImplementation() {
    this.setAttribute.mockClear().mockReturnThis();
    this.addEvent.mockClear().mockReturnThis();
    this.recordException.mockClear().mockReturnThis();
    this.setStatus.mockClear().mockReturnThis();
    this.end.mockClear();
    lastMockSpan = this as unknown as Span;
    return this;
  },
}.mockImplementation();

const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerDebug = jest.fn();
const mockGentraceClient = {
  logger: {
    error: mockLoggerError,
    warn: mockLoggerWarn,
    info: mockLoggerInfo,
    debug: mockLoggerDebug,
  },
};

describe('evalOnce() function', () => {
  const mockExperimentContext = { experimentId: 'exp-test-123', pipelineId: 'pipe-test-456' };

  let api: typeof import('@opentelemetry/api');
  let evalOnceLib: typeof import('../../src/lib/eval-once');
  let mockedStartActiveSpan: jest.Mock;
  let getStoreSpy: jest.SpiedFunction<any>;

  beforeEach((done) => {
    jest.isolateModules(() => {
      jest.doMock('@opentelemetry/api', () => {
        const originalApi = jest.requireActual('@opentelemetry/api') as typeof import('@opentelemetry/api');
        return {
          ...originalApi,
          trace: {
            getTracer: jest.fn().mockReturnValue({
              startActiveSpan: jest.fn(),
            }),
          },
          SpanStatusCode: originalApi.SpanStatusCode,
        };
      });

      jest.doMock('../../src/lib/client-instance', () => ({
        _getClient: jest.fn().mockReturnValue(mockGentraceClient),
        _isClientProperlyInitialized: jest.fn().mockReturnValue(true),
      }));

      jest.doMock('../../src/lib/otel/setup', () => ({
        setup: jest.fn(),
      }));

      api = require('@opentelemetry/api');
      evalOnceLib = require('../../src/lib/eval-once');
      const { experimentContextStorage } = require('gentrace/lib/experiment');

      jest.clearAllMocks();
      mockLoggerError.mockClear();
      mockLoggerWarn.mockClear();
      mockLoggerInfo.mockClear();
      mockLoggerDebug.mockClear();

      const mockedTracer = api.trace.getTracer('gentrace-sdk');
      mockedStartActiveSpan = mockedTracer.startActiveSpan as jest.Mock;

      mockedStartActiveSpan.mockImplementation(async (...args: any[]) => {
        const spanName = args[0] as string;
        const fn = args[1] as (span: Span) => any;

        if (typeof fn !== 'function') {
          throw new Error('Mock startActiveSpan did not receive a function as the second argument.');
        }

        mockSpan.mockImplementation();

        try {
          const result = await fn(mockSpan as unknown as Span);
          mockSpan.addEvent(ATTR_GENTRACE_FN_OUTPUT, { output: stringify(result) });
          return result;
        } catch (error: any) {
          mockSpan.recordException(error);
          mockSpan.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
          mockSpan.setAttribute('error.type', error.name);
          throw error;
        }
      });

      getStoreSpy = jest.spyOn(experimentContextStorage, 'getStore');
      getStoreSpy.mockReturnValue(mockExperimentContext);

      init({
        logger: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        },
      });

      done();
    });
  });

  it('should throw error if called outside experiment context', async () => {
    getStoreSpy.mockReturnValue(undefined);

    const testName = 'test outside context';
    const callback = jest.fn(async () => {});

    await expect(evalOnceLib.evalOnce(testName, callback)).rejects.toThrow(
      `${testName} must be called within the context of an experiment() function.`,
    );

    expect(mockedStartActiveSpan).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should start an active span with correct name and attributes', async () => {
    const testName = 'My Test Name';
    const callback = jest.fn(async () => 'result');

    await evalOnceLib.evalOnce(testName, callback);

    expect(mockedStartActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockedStartActiveSpan).toHaveBeenCalledWith(testName, expect.any(Function));

    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(
      ATTR_GENTRACE_EXPERIMENT_ID,
      mockExperimentContext.experimentId,
    );
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle async callback success', async () => {
    const testName = 'async success test';
    const expectedResult = 'async success';
    const callback = jest.fn(async () => expectedResult);

    const result = await evalOnceLib.evalOnce(testName, callback);

    expect(result).toBe(expectedResult);
    expect(callback).toHaveBeenCalledTimes(1);

    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
      output: stringify(expectedResult),
    });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.recordException).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(1);
  });

  it('should handle async callback failure', async () => {
    const testName = 'async fail test';
    const error = new Error('Async fail');
    const callback = jest.fn(async () => {
      throw error;
    });

    const result = await evalOnceLib.evalOnce(testName, callback);
    expect(result).toBeNull();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
    expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
      code: api.SpanStatusCode.ERROR,
      message: error.message,
    });
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(1);
  });

  it('should handle sync callback success', async () => {
    const testName = 'sync success test';
    const expectedResult = 'sync success';
    const callback = jest.fn(() => expectedResult);

    const result = await evalOnceLib.evalOnce(testName, callback);

    expect(result).toBe(expectedResult);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
      output: stringify(expectedResult),
    });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.recordException).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(1);
  });

  it('should not reject if sync callback fails', async () => {
    const testName = 'sync fail test';
    const error = new Error('Sync fail');
    const callback = jest.fn(() => {
      throw error;
    });

    await evalOnceLib.evalOnce(testName, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
    expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
      code: api.SpanStatusCode.ERROR,
      message: error.message,
    });
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(1);
  });
});
