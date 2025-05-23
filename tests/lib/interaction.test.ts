import { jest } from '@jest/globals';
import { Span, SpanStatusCode } from '@opentelemetry/api';
import stringify from 'json-stringify-safe';
import { InteractionOptions } from 'gentrace/lib/interaction';
import {
  ATTR_GENTRACE_FN_ARGS,
  ATTR_GENTRACE_FN_OUTPUT,
  ATTR_GENTRACE_PIPELINE_ID,
} from 'gentrace/lib/otel/constants';

let lastMockSpan: Partial<Span> | null = null;

const storedMockStartActiveSpan = jest.fn();

jest.mock('@opentelemetry/api', () => {
  const originalApi = jest.requireActual('@opentelemetry/api') as typeof import('@opentelemetry/api');

  const mockSpan = {
    setAttribute: jest.fn(),
    addEvent: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
    mockImplementation() {
      this.setAttribute.mockReturnThis();
      this.addEvent.mockReturnThis();
      this.recordException.mockReturnThis();
      this.setStatus.mockReturnThis();
      return this;
    },
  }.mockImplementation();

  storedMockStartActiveSpan.mockImplementation(((name: string, fn: (span: Span) => any) => {
    lastMockSpan = mockSpan as unknown as Span;
    try {
      const result = fn(mockSpan as unknown as Span);

      if (result instanceof Promise) {
        return result
          .then((resolved) => {
            mockSpan.end();
            return resolved;
          })
          .catch((err) => {
            mockSpan.recordException(err);
            mockSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
            mockSpan.setAttribute('error.type', err.name);
            mockSpan.end();
            throw err;
          });
      } else {
        mockSpan.end();
        return result;
      }
    } catch (error: any) {
      mockSpan.recordException(error);
      mockSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      mockSpan.setAttribute('error.type', error.name);
      mockSpan.end();
      throw error;
    }
  }) as any);

  return {
    ...originalApi,
    trace: {
      getTracer: jest.fn(() => ({
        startActiveSpan: storedMockStartActiveSpan,
      })),
    },
    SpanStatusCode: originalApi.SpanStatusCode,
  };
});

describe('interaction wrapper', () => {
  const pipelineId = 'test-pipeline-id';
  let mockStartActiveSpan: jest.Mock;
  let interaction: typeof import('../../src/lib/interaction').interaction;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    lastMockSpan = null;
    mockStartActiveSpan = storedMockStartActiveSpan;

    const interactionModule = await import('../../src/lib/interaction');
    interaction = interactionModule.interaction;
  });

  it('should wrap a synchronous function successfully', () => {
    const originalFn = jest.fn((args: { a: number }) => args.a * 2) as (args: { a: number }) => number;
    const wrappedFn = interaction('originalFn', originalFn, { pipelineId, attributes: {} });
    const result = wrappedFn({ a: 5 });

    expect(result).toBe(10);
    expect(originalFn).toHaveBeenCalledWith({ a: 5 });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockStartActiveSpan).toHaveBeenCalledWith('originalFn', expect.any(Function));

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([{ a: 5 }]),
    });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, { output: stringify(10) });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(2);
  });

  it('should wrap an asynchronous function successfully', async () => {
    const originalFn = jest.fn(async (args: { b: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `Hello ${args.b}`;
    });
    const wrappedFn = interaction('originalFn', originalFn, { pipelineId, attributes: {} });
    const result = await wrappedFn({ b: 'World' });

    expect(result).toBe('Hello World');
    expect(originalFn).toHaveBeenCalledWith({ b: 'World' });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockStartActiveSpan).toHaveBeenCalledWith('originalFn', expect.any(Function));

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([{ b: 'World' }]),
    });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
      output: stringify('Hello World'),
    });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(2);
  });

  it('should handle synchronous function throwing error', () => {
    const error = new Error('Sync Error');
    const originalFn = jest.fn((args: { c: boolean }) => {
      if (args.c) throw error;
      return false;
    });
    const wrappedFn = interaction('originalFn', originalFn, { pipelineId, attributes: {} });

    expect(() => wrappedFn({ c: true })).toThrow(error);
    expect(originalFn).toHaveBeenCalledWith({ c: true });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([{ c: true }]),
    });
    expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
    expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(2);
  });

  it('should handle asynchronous function rejecting', async () => {
    const error = new Error('Async Error');
    const originalFn = jest.fn(async (args: { d: number[] }) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw error;
    });
    const wrappedFn = interaction('originalFn', originalFn, { pipelineId, attributes: {} });

    await expect(wrappedFn({ d: [1, 2] })).rejects.toThrow(error);
    expect(originalFn).toHaveBeenCalledWith({ d: [1, 2] });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([{ d: [1, 2] }]),
    });
    expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
    expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(2);
  });

  it('should use custom span name from options', () => {
    const originalFn = jest.fn(({ a }: { a: number }) => 'result');
    const options: InteractionOptions = { pipelineId, attributes: {} };
    const wrappedFn = interaction('customInteractionName', originalFn, options);
    wrappedFn({ a: 1 });

    expect(mockStartActiveSpan).toHaveBeenCalledWith('customInteractionName', expect.any(Function));
  });

  it('should handle functions with no name (anonymous)', () => {
    const wrappedFn = interaction('anonymousInteraction', (args: {}) => 'anon result', { pipelineId });
    wrappedFn({});
    expect(mockStartActiveSpan).toHaveBeenCalledWith(
      expect.stringContaining('anonymousInteraction'),
      expect.any(Function),
    );
  });

  it('should correctly stringify complex arguments and outputs', () => {
    const date = new Date();
    const complexArg = { date, nested: { arr: [1, 'b'] } };
    const complexOutput = { value: 100, set: new Set([1, 2]) };
    const originalFn = jest.fn((args: typeof complexArg) => complexOutput);
    const wrappedFn = interaction('complexInteraction', originalFn, { pipelineId });
    wrappedFn(complexArg);

    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, {
      args: stringify([complexArg]),
    });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
      output: stringify(complexOutput),
    });
  });

  describe('functions with no parameters', () => {
    it('should wrap and execute a synchronous function with no parameters', () => {
      const syncNoParamsFn = jest.fn(() => 'sync success');
      const wrappedFn = interaction('syncNoParamsFn', syncNoParamsFn, { pipelineId });
      const result = wrappedFn();

      expect(result).toBe('sync success');
      expect(syncNoParamsFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('syncNoParamsFn', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
        output: stringify('sync success'),
      });
      expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should wrap and execute an asynchronous function with no parameters', async () => {
      const asyncNoParamsFn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return 'async success';
      });
      const wrappedFn = interaction('asyncNoParamsFn', asyncNoParamsFn, { pipelineId });
      const result = await wrappedFn();

      expect(result).toBe('async success');
      expect(asyncNoParamsFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('asyncNoParamsFn', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_OUTPUT, {
        output: stringify('async success'),
      });
      expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should handle errors in a synchronous function with no parameters', () => {
      const error = new Error('Sync NoParam Error');
      const syncErrorFn = jest.fn(() => {
        throw error;
      });
      const wrappedFn = interaction('syncErrorFn', syncErrorFn, { pipelineId });

      expect(() => wrappedFn()).toThrow(error);
      expect(syncErrorFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('syncErrorFn', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
      expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
      expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should handle rejections in an asynchronous function with no parameters', async () => {
      const error = new Error('Async NoParam Error');
      const asyncRejectFn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        throw error;
      });
      const wrappedFn = interaction('asyncRejectFn', asyncRejectFn, { pipelineId });

      await expect(wrappedFn()).rejects.toThrow(error);
      expect(asyncRejectFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('asyncRejectFn', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, pipelineId);
      expect(lastMockSpan?.addEvent).toHaveBeenCalledWith(ATTR_GENTRACE_FN_ARGS, { args: stringify([]) });
      expect(lastMockSpan?.recordException).toHaveBeenCalledWith(error);
      expect(lastMockSpan?.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('error.type', error.name);
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });
  });
});
