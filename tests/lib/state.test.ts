import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('GentraceState', () => {
  const originalApiKey = process.env['GENTRACE_API_KEY'];
  const originalBaseUrl = process.env['GENTRACE_BASE_URL'];

  let stateLib: typeof import('../../src/lib/state');

  beforeEach((done) => {
    delete process.env['GENTRACE_API_KEY'];
    delete process.env['GENTRACE_BASE_URL'];

    jest.isolateModules(() => {
      jest.clearAllMocks();
      stateLib = require('../../src/lib/state');
      // Ensure global state starts null for the isolated module
      stateLib._setGlobalState(null as any);

      done();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env['GENTRACE_API_KEY'] = originalApiKey;
    process.env['GENTRACE_BASE_URL'] = originalBaseUrl;
    // Reset global state using the exported setter
    if (stateLib && typeof stateLib._setGlobalState === 'function') {
      stateLib._setGlobalState(null as any);
    }
  });

  it('should initialize with default options if none provided', () => {
    process.env['GENTRACE_API_KEY'] = 'default-key';
    const state = new stateLib.GentraceState();
    const client = state.getClient();
    expect(client.bearerToken).toBe('default-key');
    expect(client.baseURL).toBe('https://gentrace.ai/api');
    expect(state.getOptions()).toEqual({});
  });

  it('should initialize with provided options', () => {
    const options = {
      bearerToken: 'provided-key',
      baseURL: 'https://provided.gentrace.ai/api',
    };
    const state = new stateLib.GentraceState(options);
    expect(state.getOptions()).toEqual(expect.objectContaining(options));
    const client = state.getClient();
    expect(client.bearerToken).toBe(options.bearerToken);
    expect(client.baseURL).toBe(options.baseURL);
  });

  it('should prioritize provided options over environment variables', () => {
    process.env['GENTRACE_API_KEY'] = 'env-key';
    process.env['GENTRACE_BASE_URL'] = 'https://env.gentrace.ai/api';
    const options = {
      bearerToken: 'provided-key',
      baseURL: 'https://provided.gentrace.ai/api',
    };
    const state = new stateLib.GentraceState(options);
    expect(state.getOptions()).toEqual(expect.objectContaining(options));
    const client = state.getClient();
    expect(client.bearerToken).toBe(options.bearerToken);
    expect(client.baseURL).toBe(options.baseURL);
  });

  it('getClient should return the initialized client', () => {
    process.env['GENTRACE_API_KEY'] = 'test-key';
    const state = new stateLib.GentraceState();
    const client = state.getClient();
    expect(client).toBeDefined();
    expect(client.bearerToken).toBe('test-key');
  });

  describe('runWith', () => {
    it('should run the callback within the state context', () => {
      // Explicitly set a global state first
      const globalState = new stateLib.GentraceState({ bearerToken: 'global-key' });
      stateLib._setGlobalState(globalState);

      process.env['GENTRACE_API_KEY'] = 'test-key';
      const state = new stateLib.GentraceState();
      const callback = jest.fn(() => {
        expect(stateLib.GentraceState.getActiveState()).toBe(state);
        return 'result';
      });
      const result = state.runWith(callback);
      expect(result).toBe('result');
      expect(callback).toHaveBeenCalledTimes(1);
      // Back to the explicitly set global state
      expect(stateLib.GentraceState.getActiveState()).toBe(globalState);
    });

    it('should restore previous state after nested calls', () => {
      // Explicitly set a global state first
      const globalState = new stateLib.GentraceState({ bearerToken: 'global-key' });
      stateLib._setGlobalState(globalState);

      const state1 = new stateLib.GentraceState({ bearerToken: 'state1' });
      const state2 = new stateLib.GentraceState({ bearerToken: 'state2' });

      expect(stateLib.GentraceState.getActiveState()).toBe(globalState);
      state1.runWith(() => {
        expect(stateLib.GentraceState.getActiveState()).toBe(state1);
        state2.runWith(() => {
          expect(stateLib.GentraceState.getActiveState()).toBe(state2);
        });
        expect(stateLib.GentraceState.getActiveState()).toBe(state1);
      });
      expect(stateLib.GentraceState.getActiveState()).toBe(globalState);
    });
  });

  describe('getActiveState', () => {
    it('should return the global state by default when not in runWith', () => {
      // Explicitly set a global state
      process.env['GENTRACE_API_KEY'] = 'global-default';
      const globalState = new stateLib.GentraceState();
      stateLib._setGlobalState(globalState);

      const activeState = stateLib.GentraceState.getActiveState();
      expect(activeState).toBeDefined();
      expect(activeState).toBe(globalState);
      expect(activeState).toBe(stateLib._globalState);
    });
  });
});
