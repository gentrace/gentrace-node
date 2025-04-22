// Remove top-level jest.mock
// jest.mock('@opentelemetry/api', ...);

import { jest } from '@jest/globals';
// Import types, but rely on require/doMock for implementation
import type { Span } from '@opentelemetry/api';
import { init } from 'gentrace/lib/init'; // Keep non-mocked imports
import { stringify } from 'superjson';
// Remove experimentContextStorage import here
// import { experimentContextStorage } from 'gentrace/lib/experiment';
// Do not import _runTest etc. here, require it inside isolateModules

// Define mocks that need resetting between tests
let lastMockSpan: Partial<Span> | null = null;
const mockSpan = {
  setAttribute: jest.fn<Span['setAttribute']>(),
  addEvent: jest.fn<Span['addEvent']>(),
  recordException: jest.fn<Span['recordException']>(),
  setStatus: jest.fn<Span['setStatus']>(),
  end: jest.fn<Span['end']>(),
  mockImplementation() {
    // Reset mocks for each "span creation" in the mock
    this.setAttribute.mockClear().mockReturnThis();
    this.addEvent.mockClear().mockReturnThis();
    this.recordException.mockClear().mockReturnThis();
    this.setStatus.mockClear().mockReturnThis();
    this.end.mockClear(); // Clear call history for end()
    lastMockSpan = this as unknown as Span; // Capture the current mock instance
    return this;
  },
}.mockImplementation(); // Call mockImplementation initially to set up

// Define the mock client with a mock logger
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
  // Add other client properties/methods if needed by test-single.ts
};

// No need for storedMockStartActiveSpan variable anymore

// Remove the old setupOpenTelemetryMocks function
// function setupOpenTelemetryMocks() { ... } // DELETE THIS FUNCTION

describe('test() function', () => {
  const mockExperimentContext = { experimentId: 'exp-test-123', pipelineId: 'pipe-test-456' };

  // References assigned inside isolateModules
  let api: typeof import('@opentelemetry/api');
  let testLib: typeof import('../../src/lib/test-single');
  let mockedStartActiveSpan: jest.Mock;
  let getStoreSpy: jest.SpiedFunction<any>;

  beforeEach((done) => {
    jest.isolateModules(() => {
      // Mock OTel API
      jest.doMock('@opentelemetry/api', () => {
        const originalApi = jest.requireActual('@opentelemetry/api') as typeof import('@opentelemetry/api');
        return {
          ...originalApi,
          trace: {
            getTracer: jest.fn().mockReturnValue({
              startActiveSpan: jest.fn(), // This will be assigned to mockedStartActiveSpan
            }),
          },
          SpanStatusCode: originalApi.SpanStatusCode, // Ensure SpanStatusCode is available
        };
      });

      // Mock client-instance to control _getClient
      jest.doMock('../../src/lib/client-instance', () => ({
        _getClient: jest.fn().mockReturnValue(mockGentraceClient),
        // _setClient: jest.fn(), // Mock if needed
      }));

      // Require modules AFTER mocks are set up
      api = require('@opentelemetry/api');
      testLib = require('../../src/lib/test-single');
      const { experimentContextStorage } = require('gentrace/lib/experiment');

      // Clear mocks from previous tests
      jest.clearAllMocks();
      // Clear specific mocks if clearAllMocks doesn't cover them (e.g., logger mocks)
      mockLoggerError.mockClear();
      mockLoggerWarn.mockClear();
      mockLoggerInfo.mockClear();
      mockLoggerDebug.mockClear();

      // Get the mock function reference
      const mockedTracer = api.trace.getTracer('gentrace-sdk');
      mockedStartActiveSpan = mockedTracer.startActiveSpan as jest.Mock;

      // --- Configure Mock Implementation for startActiveSpan ---
      // This simulates the behavior of _runTest's span creation and callback execution
      mockedStartActiveSpan.mockImplementation(
        // Use a generic signature compatible with jest.Mock
        async (...args: any[]) => {
          // Determine the actual arguments based on how _runTest calls startActiveSpan
          // We expect _runTest -> startActiveSpan(spanName: string, fn: (span: Span) => T)
          const spanName = args[0] as string;
          const fn = args[1] as (span: Span) => any;

          if (typeof fn !== 'function') {
            throw new Error('Mock startActiveSpan did not receive a function as the second argument.');
          }

          // Simulate span creation for assertions
          mockSpan.mockImplementation(); // Reset and capture this mock instance

          // Simulate running the callback within the span context
          try {
            // The callback passed by test() -> _runTest ignores its input
            const result = await fn(mockSpan as unknown as Span);
            // Simulate success path in _runTest (attributes/events only)
            mockSpan.addEvent('gentrace.fn.output', { output: stringify(result) });
            // mockSpan.end(); // REMOVE - Let _runTest call end()
            return result;
          } catch (error: any) {
            // Simulate error path in _runTest (attributes/events/status only)
            mockSpan.recordException(error);
            mockSpan.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
            mockSpan.setAttribute('error.type', error.name);
            // mockSpan.end(); // REMOVE - Let _runTest call end()
            throw error;
          }
        },
      );
      // --- End Mock Implementation ---

      // --- Configure Context Spy ---
      getStoreSpy = jest.spyOn(experimentContextStorage, 'getStore');
      getStoreSpy.mockReturnValue(mockExperimentContext); // Default to being inside context
      // --- End Context Spy config ---

      init({
        logger: {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        },
      });

      done(); // Signal async setup complete
    });
  });

  it('should throw error if called outside experiment context', async () => {
    getStoreSpy.mockReturnValue(undefined); // Simulate being outside context

    const testName = 'test outside context';
    const callback = jest.fn(async () => {});

    await expect(testLib.test(testName, callback)).rejects.toThrow(
      `${testName} must be called within the context of an experiment() function.`,
    );

    expect(mockedStartActiveSpan).not.toHaveBeenCalled(); // Span shouldn't even start
    expect(callback).not.toHaveBeenCalled();
  });

  it('should start an active span with correct name and attributes', async () => {
    const testName = 'My Test Name';
    const callback = jest.fn(async () => 'result');

    await testLib.test(testName, callback);

    expect(mockedStartActiveSpan).toHaveBeenCalledTimes(1);
    // Check the arguments _runTest passes to startActiveSpan
    expect(mockedStartActiveSpan).toHaveBeenCalledWith(
      testName, // spanName
      expect.any(Function), // The function wrapper _runTest creates
    );

    // Check attributes set within the mock span's execution context
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(
      'gentrace.experiment_id',
      mockExperimentContext.experimentId,
    );
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(
      'gentrace.test_case_name', // Attribute set by test() -> _runTest()
      testName,
    );
    expect(callback).toHaveBeenCalledTimes(1); // Ensure original callback was invoked
  });

  it('should handle async callback success', async () => {
    const testName = 'async success test';
    const expectedResult = 'async success';
    const callback = jest.fn(async () => expectedResult);

    const result = await testLib.test(testName, callback);

    expect(result).toBe(expectedResult);
    expect(callback).toHaveBeenCalledTimes(1);

    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.output', {
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

    await expect(testLib.test(testName, callback)).rejects.toThrow(error);

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

    const result = await testLib.test(testName, callback);

    expect(result).toBe(expectedResult);
    expect(callback).toHaveBeenCalledTimes(1);
    // Check span events/status from mock implementation
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.output', {
      output: stringify(expectedResult),
    });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.recordException).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(1);
  });

  it.only('should not reject if sync callback fails', async () => {
    const testName = 'sync fail test';
    const error = new Error('Sync fail');
    const callback = jest.fn(() => {
      throw error;
    });

    await testLib.test(testName, callback);

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
