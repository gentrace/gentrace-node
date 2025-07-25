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

// Mock the utils module
jest.mock('../../src/lib/utils', () => {
  const actualUtils = jest.requireActual('../../src/lib/utils') as any;
  return {
    ...actualUtils,
    isValidUUID: jest.fn(() => true),
    validatePipelineAccess: jest.fn(() => Promise.resolve()),
    displayPipelineError: jest.fn(),
    checkOtelConfigAndWarn: jest.fn(),
    isOtelConfigured: jest.fn(() => true),
  };
});

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

  describe('optional options parameter', () => {
    it('should work without options parameter and use default pipeline ID', () => {
      const originalFn = jest.fn(() => 'no options result');
      const wrappedFn = interaction('noOptionsTest', originalFn);
      const result = wrappedFn();

      expect(result).toBe('no options result');
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('noOptionsTest', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, 'default');
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should work with empty options object and use default pipeline ID', () => {
      const originalFn = jest.fn(() => 'empty options result');
      const wrappedFn = interaction('emptyOptionsTest', originalFn, {});
      const result = wrappedFn();

      expect(result).toBe('empty options result');
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('emptyOptionsTest', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, 'default');
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should work with only attributes in options and use default pipeline ID', () => {
      const originalFn = jest.fn(() => 'attributes only result');
      const wrappedFn = interaction('attributesOnlyTest', originalFn, {
        attributes: { custom: 'value' },
      });
      const result = wrappedFn();

      expect(result).toBe('attributes only result');
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('attributesOnlyTest', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, 'default');
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith('custom', 'value');
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should handle async functions without options parameter', async () => {
      const originalFn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return 'async no options result';
      });
      const wrappedFn = interaction('asyncNoOptionsTest', originalFn);
      const result = await wrappedFn();

      expect(result).toBe('async no options result');
      expect(originalFn).toHaveBeenCalledTimes(1);
      expect(mockStartActiveSpan).toHaveBeenCalledWith('asyncNoOptionsTest', expect.any(Function));

      expect(lastMockSpan).not.toBeNull();
      expect(lastMockSpan?.setAttribute).toHaveBeenCalledWith(ATTR_GENTRACE_PIPELINE_ID, 'default');
      expect(lastMockSpan?.end).toHaveBeenCalled();
    });

    it('should not validate UUID for default pipeline ID', () => {
      const utils = require('../../src/lib/utils');
      const originalFn = jest.fn(() => 'result');

      // Reset the mock to track calls
      utils.isValidUUID.mockClear();
      utils.validatePipelineAccess.mockClear();

      const wrappedFn = interaction('defaultPipelineTest', originalFn);
      wrappedFn();

      // isValidUUID should not be called when pipeline ID is 'default'
      expect(utils.isValidUUID).not.toHaveBeenCalledWith('default');
      // validatePipelineAccess should not be called for 'default'
      expect(utils.validatePipelineAccess).not.toHaveBeenCalled();
    });
  });
});

describe('interaction auto-initialization', () => {
  let interaction: typeof import('../../src/lib/interaction').interaction;
  let mockInit: jest.Mock;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    lastMockSpan = null;
    originalEnv = { ...process.env };

    // Mock the init function
    mockInit = jest.fn();
    jest.doMock('../../src/lib/init', () => ({
      init: mockInit,
    }));

    // Mock the init-state module
    jest.doMock('../../src/lib/init-state', () => ({
      _isGentraceInitialized: jest.fn(() => false),
    }));

    // Mock the utils module
    jest.doMock('../../src/lib/utils', () => ({
      isOtelConfigured: jest.fn(() => false),
      checkOtelConfigAndWarn: jest.fn(),
      isValidUUID: jest.fn(() => true),
      validatePipelineAccess: jest.fn(() => Promise.resolve()),
      displayPipelineError: jest.fn(),
    }));

    const interactionModule = await import('../../src/lib/interaction');
    interaction = interactionModule.interaction;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should auto-initialize when GENTRACE_API_KEY is set and OTel is not configured', async () => {
    process.env['GENTRACE_API_KEY'] = 'test-api-key';
    process.env['GENTRACE_BASE_URL'] = 'https://test.gentrace.ai';

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    const result = wrappedFn();

    expect(mockInit).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      baseURL: 'https://test.gentrace.ai',
    });
    expect(result).toBe('result');
    expect(originalFn).toHaveBeenCalled();
  });

  it('should auto-initialize with only API key when base URL is not set', async () => {
    process.env['GENTRACE_API_KEY'] = 'test-api-key';
    delete process.env['GENTRACE_BASE_URL'];

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    wrappedFn();

    expect(mockInit).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
    });
  });

  it('should not auto-initialize when API key is not set', async () => {
    delete process.env['GENTRACE_API_KEY'];

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    wrappedFn();

    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should not auto-initialize when OTel is already configured', async () => {
    process.env['GENTRACE_API_KEY'] = 'test-api-key';

    // Mock OTel as configured
    jest.resetModules();
    jest.doMock('../../src/lib/utils', () => ({
      isOtelConfigured: jest.fn(() => true),
      checkOtelConfigAndWarn: jest.fn(),
      isValidUUID: jest.fn(() => true),
      validatePipelineAccess: jest.fn(() => Promise.resolve()),
      displayPipelineError: jest.fn(),
    }));

    const interactionModule = await import('../../src/lib/interaction');
    interaction = interactionModule.interaction;

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    wrappedFn();

    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should not auto-initialize when Gentrace is already initialized', async () => {
    process.env['GENTRACE_API_KEY'] = 'test-api-key';

    // Mock Gentrace as already initialized
    jest.resetModules();
    jest.doMock('../../src/lib/init-state', () => ({
      _isGentraceInitialized: jest.fn(() => true),
    }));

    const interactionModule = await import('../../src/lib/interaction');
    interaction = interactionModule.interaction;

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    wrappedFn();

    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should auto-initialize only once even when wrapped function is called multiple times', async () => {
    process.env['GENTRACE_API_KEY'] = 'test-api-key';

    const originalFn = jest.fn(() => 'result');
    const wrappedFn = interaction('testFn', originalFn, { pipelineId: 'test-pipeline' });

    // First call should trigger initialization
    wrappedFn();
    expect(mockInit).toHaveBeenCalledTimes(1);

    // Subsequent calls should not trigger initialization
    // We'll simulate that Gentrace is now initialized by creating a new wrapped function
    // after the first initialization
    jest.resetModules();
    jest.doMock('../../src/lib/init-state', () => ({
      _isGentraceInitialized: jest.fn(() => true), // Now it's initialized
    }));
    jest.doMock('../../src/lib/utils', () => ({
      isOtelConfigured: jest.fn(() => false),
      checkOtelConfigAndWarn: jest.fn(),
      isValidUUID: jest.fn(() => true),
      validatePipelineAccess: jest.fn(() => Promise.resolve()),
      displayPipelineError: jest.fn(),
    }));

    const interactionModule2 = await import('../../src/lib/interaction');
    const interaction2 = interactionModule2.interaction;

    const originalFn2 = jest.fn(() => 'result2');
    const wrappedFn2 = interaction2('testFn2', originalFn2, { pipelineId: 'test-pipeline' });

    wrappedFn2();
    wrappedFn2();

    // Init should still have been called only once (from the first call)
    expect(mockInit).toHaveBeenCalledTimes(1);
  });
});
