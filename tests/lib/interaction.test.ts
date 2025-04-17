import { jest } from '@jest/globals';
import { Span, SpanStatusCode } from '@opentelemetry/api';
import { stringify } from 'superjson';
import type { InteractionSpanOptions as InteractionSpanOptionsType } from '../../src/lib/interaction';

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
    const wrappedFn = interaction(pipelineId, originalFn, { name: 'originalFn' });
    const result = wrappedFn({ a: 5 });

    expect(result).toBe(10);
    expect(originalFn).toHaveBeenCalledWith({ a: 5 });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockStartActiveSpan).toHaveBeenCalledWith('originalFn', expect.any(Function));

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('pipelineId', pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.args', { args: stringify({ a: 5 }) });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.output', { output: stringify(10) });
    expect(lastMockSpan?.setStatus).not.toHaveBeenCalled();
    expect(lastMockSpan?.end).toHaveBeenCalledTimes(2);
  });

  it('should wrap an asynchronous function successfully', async () => {
    const originalFn = jest.fn(async (args: { b: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `Hello ${args.b}`;
    });
    const wrappedFn = interaction(pipelineId, originalFn, { name: 'originalFn' });
    const result = await wrappedFn({ b: 'World' });

    expect(result).toBe('Hello World');
    expect(originalFn).toHaveBeenCalledWith({ b: 'World' });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);
    expect(mockStartActiveSpan).toHaveBeenCalledWith('originalFn', expect.any(Function));

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('pipelineId', pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.args', {
      args: stringify({ b: 'World' }),
    });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.output', {
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
    const wrappedFn = interaction(pipelineId, originalFn, { name: 'originalFn' });

    expect(() => wrappedFn({ c: true })).toThrow(error);
    expect(originalFn).toHaveBeenCalledWith({ c: true });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('pipelineId', pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.args', { args: stringify({ c: true }) });
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
    const wrappedFn = interaction(pipelineId, originalFn, { name: 'originalFn' });

    await expect(wrappedFn({ d: [1, 2] })).rejects.toThrow(error);
    expect(originalFn).toHaveBeenCalledWith({ d: [1, 2] });
    expect(mockStartActiveSpan).toHaveBeenCalledTimes(1);

    expect(lastMockSpan).not.toBeNull();
    expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('pipelineId', pipelineId);
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.args', {
      args: stringify({ d: [1, 2] }),
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
    const originalFn = jest.fn(() => 'result');
    const options: InteractionSpanOptionsType = { name: 'customInteractionName' };
    const wrappedFn = interaction(pipelineId, originalFn, options);
    wrappedFn();

    expect(mockStartActiveSpan).toHaveBeenCalledWith('customInteractionName', expect.any(Function));
  });

  it('should handle functions with no name (anonymous)', () => {
    const wrappedFn = interaction(pipelineId, (args: {}) => 'anon result');
    wrappedFn({});
    expect(mockStartActiveSpan).toHaveBeenCalledWith(
      expect.stringContaining('Interaction'),
      expect.any(Function),
    );
  });

  it('should correctly stringify complex arguments and outputs', () => {
    const date = new Date();
    const complexArg = { date, nested: { arr: [1, 'b'] } };
    const complexOutput = { value: BigInt(100), set: new Set([1, 2]) };
    const originalFn = jest.fn((args: typeof complexArg) => complexOutput);
    const wrappedFn = interaction(pipelineId, originalFn);
    wrappedFn(complexArg);

    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.args', { args: stringify(complexArg) });
    expect(lastMockSpan?.addEvent).toHaveBeenCalledWith('gentrace.fn.output', {
      output: stringify(complexOutput),
    });
  });
});
