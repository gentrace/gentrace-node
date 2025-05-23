import { SpanStatusCode } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { traced } from '../../src/lib/traced';
import { ATTR_GENTRACE_FN_ARGS, ATTR_GENTRACE_FN_OUTPUT } from 'gentrace/lib/otel/constants';

// Mock OpenTelemetry API
const mockSpan = {
  addEvent: jest.fn(),
  recordException: jest.fn(),
  setStatus: jest.fn(),
  setAttribute: jest.fn(),
  end: jest.fn(),
};

const mockTracer = {
  startActiveSpan: jest.fn().mockImplementation((name, fn) => {
    // Immediately call the provided function with the mock span
    // Handle both sync and async cases
    try {
      const result = fn(mockSpan);
      if (result instanceof Promise) {
        return result
          .then((value) => {
            // Assuming successful async functions don't explicitly set status OK
            return value;
          })
          .catch((error) => {
            // Error path is handled inside the traced function's catch block
            throw error;
          });
      } else {
        // Assuming successful sync functions don't explicitly set status OK
        return result;
      }
    } catch (error) {
      // Error path for sync functions handled inside traced function's catch block
      throw error;
    }
  }),
};

// Use jest.mock to replace the actual module with our mock implementation
jest.mock('@opentelemetry/api', () => {
  // Capture the actual SpanStatusCode enum values if possible, otherwise use mocks
  const originalApi = jest.requireActual('@opentelemetry/api');
  return {
    trace: {
      getTracer: jest.fn(() => mockTracer),
    },
    SpanStatusCode: originalApi.SpanStatusCode || { ERROR: 'ERROR_STATUS_CODE', OK: 'OK_STATUS_CODE' }, // Fallback if needed
  };
});

describe('traced decorator', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Need to reset mockTracer.startActiveSpan mock implementation calls too
    mockTracer.startActiveSpan.mockClear();
    mockSpan.addEvent.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.setAttribute.mockClear();
    mockSpan.end.mockClear();
  });

  it('should trace a successful synchronous function', async () => {
    function syncAdd(a: number, b: number) {
      return a + b;
    }

    const tracedAdd = traced('syncAdd', syncAdd);
    const result = await tracedAdd(2, 3);

    expect(result).toBe(5);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('syncAdd', expect.any(Function));
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2);
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([2, 3]) });
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, { output: stringify(5) });
    expect(mockSpan.recordException).not.toHaveBeenCalled();
    expect(mockSpan.setStatus).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: SpanStatusCode.ERROR }),
    );
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should trace a successful asynchronous function', async () => {
    async function asyncMultiply(a: number, b: number): Promise<number> {
      return Promise.resolve(a * b);
    }

    const tracedMultiply = traced('asyncMultiply', asyncMultiply);
    const result = await tracedMultiply(4, 5);

    expect(result).toBe(20);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('asyncMultiply', expect.any(Function));
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2);
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([4, 5]) });
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, { output: stringify(20) });
    expect(mockSpan.recordException).not.toHaveBeenCalled();
    expect(mockSpan.setStatus).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: SpanStatusCode.ERROR }),
    );
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should trace a synchronous function that throws an error', async () => {
    function syncError(): never {
      throw new Error('Sync fail');
    }

    const tracedError = traced('syncError', syncError);

    expect(() => tracedError()).toThrow('Sync fail');

    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('syncError', expect.any(Function));
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(1); // Only args event
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
    expect(mockSpan.recordException).toHaveBeenCalledTimes(1);
    expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSpan.setStatus).toHaveBeenCalledTimes(1);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Sync fail' });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'Error');
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should trace an asynchronous function that rejects', async () => {
    async function asyncReject(): Promise<never> {
      return Promise.reject(new Error('Async fail'));
    }

    const tracedReject = traced('asyncReject', asyncReject);

    await expect(tracedReject()).rejects.toThrow('Async fail');

    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('asyncReject', expect.any(Function));
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(1); // Only args event
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
    expect(mockSpan.recordException).toHaveBeenCalledTimes(1);
    expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSpan.setStatus).toHaveBeenCalledTimes(1);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'Async fail' });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'Error');
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should use the provided name parameter', async () => {
    async function originalName() {
      return 'result';
    }

    const tracedFn = traced('customSpanName', originalName, { attributes: {} });
    await tracedFn();

    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('customSpanName', expect.any(Function));
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should correctly use function name when name parameter is the same', async () => {
    async function functionWithName() {
      return 'result';
    }

    const tracedFn = traced('functionWithName', functionWithName);
    await tracedFn();

    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('functionWithName', expect.any(Function));
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });

  it('should handle functions with complex arguments and return values', async () => {
    const tracedComplex = traced('complexFunction', async (obj: object, arr: any[]) => {
      return { ...obj, newProp: arr.length };
    });

    const argObj = { a: 1, b: 'hello' };
    const argArr = [true, null, 123];
    const expectedResult = { a: 1, b: 'hello', newProp: 3 };

    const result = await tracedComplex(argObj, argArr);

    expect(result).toEqual(expectedResult);
    expect(mockTracer.startActiveSpan).toHaveBeenCalledTimes(1);
    // Function name might be empty string or specific depending on env, check default
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith('complexFunction', expect.any(Function));
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2);
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([argObj, argArr]),
    });
    expect(mockSpan.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
      output: stringify(expectedResult),
    });
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
  });
});
