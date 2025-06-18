import { jest } from '@jest/globals';

const mock_setClient = jest.fn();

// Define a reusable mock client instance
const mockClientInstance = {
  pipelines: {},
  experiments: {},
  datasets: {},
  testCases: {},
  // Add other properties/methods if init.ts or its dependencies use them
};

// Mock client-instance, ensuring _getClient returns the mock instance immediately
jest.mock('../../src/lib/client-instance', () => ({
  _getClient: jest.fn().mockReturnValue(mockClientInstance),
  _setClient: mock_setClient,
  _isClientProperlyInitialized: jest.fn().mockReturnValue(true),
}));

// Mock otel/setup to prevent actual OpenTelemetry initialization during tests
jest.mock('../../src/lib/otel/setup', () => ({
  setup: jest.fn(),
}));

import { ClientOptions } from '../../src';

describe('init', () => {
  beforeEach(() => {
    jest.resetModules(); // This is important to re-run module top-level code with fresh mocks
    jest.clearAllMocks();
  });

  it('should initialize the client with default options', async () => {
    const { init } = await import('../../src/lib/init');

    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    init({ logger: mockLogger });

    expect(mock_setClient).toHaveBeenCalledTimes(1);
    expect(mock_setClient).toHaveBeenCalledWith({ logger: mockLogger });
  });

  it('should initialize the client with provided options', async () => {
    // Import init *after* mocks are fully configured by jest.mock
    const { init } = await import('../../src/lib/init');

    const options: ClientOptions = { apiKey: 'test-key', baseURL: 'test-url' };

    init(options);

    expect(mock_setClient).toHaveBeenCalledTimes(1);
    expect(mock_setClient).toHaveBeenCalledWith(options);
  });

  it('should allow multiple initializations (though typically not recommended)', async () => {
    // Import init *after* mocks are fully configured by jest.mock
    const { init } = await import('../../src/lib/init');

    const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    init({ logger: mockLogger });

    expect(mock_setClient).toHaveBeenCalledTimes(1);

    const options: ClientOptions = { apiKey: 'non-global-key' };
    init(options);

    expect(mock_setClient).toHaveBeenCalledTimes(2);
    expect(mock_setClient).toHaveBeenCalledWith(options);
  });
});
