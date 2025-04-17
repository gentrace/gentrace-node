import { jest } from '@jest/globals';

const mock_setGlobalState = jest.fn();
const mock_setClient = jest.fn();

// Define a reusable mock client instance
const mockClientInstance = {
  pipelines: {},
  experiments: {},
  datasets: {},
  testCases: {},
  // Add other properties/methods if init.ts or its dependencies use them
};

class MockGentraceStateImpl {}

let createdMockInstance: MockGentraceStateImpl | null = null;

jest.mock('../../src/lib/state', () => {
  return {
    GentraceState: jest.fn().mockImplementation(() => {
      createdMockInstance = new MockGentraceStateImpl();
      return createdMockInstance;
    }),
    _setGlobalState: mock_setGlobalState,
  };
});

// Mock client-instance, ensuring _getClient returns the mock instance immediately
jest.mock('../../src/lib/client-instance', () => ({
  _getClient: jest.fn().mockReturnValue(mockClientInstance),
  _setClient: mock_setClient,
}));

import { GentraceState } from '../../src/lib/state';
import { ClientOptions } from '../../src';

interface MockedStateModule {
  GentraceState: jest.MockedClass<typeof GentraceState>;
  _setGlobalState: jest.Mock;
}

describe('init', () => {
  let MockGentraceStateConstructor: jest.MockedClass<typeof GentraceState>;

  beforeEach(() => {
    jest.resetModules(); // This is important to re-run module top-level code with fresh mocks
    jest.clearAllMocks();
    createdMockInstance = null;

    // Get the constructor mock from the already-mocked state module
    MockGentraceStateConstructor = (jest.requireMock('../../src/lib/state') as MockedStateModule)
      .GentraceState;
    // _setGlobalState is part of the same mock
    // No need to re-assign mock_setClient as it's cleared by clearAllMocks if needed

    // We don't need to get and set the return value for _getClient here anymore,
    // as it's set directly in the jest.mock factory.
  });

  it('should create a GentraceState instance with default options', async () => {
    // Import init *after* mocks are fully configured by jest.mock
    const { init } = await import('../../src/lib/init');

    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const state = init({ logger: mockLogger });

    expect(MockGentraceStateConstructor).toHaveBeenCalledTimes(1);
    expect(MockGentraceStateConstructor).toHaveBeenCalledWith({ logger: mockLogger });
    expect(state).toBeInstanceOf(MockGentraceStateImpl);
    expect(state).toBe(createdMockInstance);
    expect(mock_setGlobalState).toHaveBeenCalledTimes(1);
    expect(mock_setGlobalState).toHaveBeenCalledWith(createdMockInstance);
    expect(mock_setClient).toHaveBeenCalledTimes(1);
    expect(mock_setClient).toHaveBeenCalledWith({ logger: mockLogger });
  });

  it('should create a GentraceState instance with provided options', async () => {
    // Import init *after* mocks are fully configured by jest.mock
    const { init } = await import('../../src/lib/init');

    const options: ClientOptions = { bearerToken: 'test-key', baseURL: 'test-url' };

    const state = init(options);

    expect(MockGentraceStateConstructor).toHaveBeenCalledTimes(1);
    expect(MockGentraceStateConstructor).toHaveBeenCalledWith(options);
    expect(state).toBeInstanceOf(MockGentraceStateImpl);
    expect(state).toBe(createdMockInstance);
    expect(mock_setGlobalState).toHaveBeenCalledTimes(1);
    expect(mock_setGlobalState).toHaveBeenCalledWith(createdMockInstance);
    expect(mock_setClient).toHaveBeenCalledTimes(1);
    expect(mock_setClient).toHaveBeenCalledWith(options);
  });

  it('should return the created state instance', async () => {
    // Import init *after* mocks are fully configured by jest.mock
    const { init } = await import('../../src/lib/init');

    const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const stateDefault = init({ logger: mockLogger });

    expect(stateDefault).toBeInstanceOf(MockGentraceStateImpl);
    expect(stateDefault).toBe(createdMockInstance);
    const firstInstance = createdMockInstance;
    expect(MockGentraceStateConstructor).toHaveBeenCalledTimes(1);
    expect(mock_setGlobalState).toHaveBeenCalledTimes(1);
    expect(mock_setClient).toHaveBeenCalledTimes(1);

    createdMockInstance = null;

    const options: ClientOptions = { bearerToken: 'non-global-key' };
    const stateNonGlobal = init(options);

    expect(stateNonGlobal).toBeInstanceOf(MockGentraceStateImpl);
    expect(stateNonGlobal).toBe(createdMockInstance);
    expect(stateNonGlobal).not.toBe(firstInstance);
    expect(MockGentraceStateConstructor).toHaveBeenCalledTimes(2);
    expect(mock_setGlobalState).toHaveBeenCalledTimes(2);
    expect(mock_setClient).toHaveBeenCalledTimes(2);
    expect(mock_setClient).toHaveBeenCalledWith(options);
  });
});
