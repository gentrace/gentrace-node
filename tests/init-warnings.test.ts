import { jest } from '@jest/globals';
import { init } from 'gentrace';
import { _getInitHistory } from 'gentrace/lib/init-state';

describe('Multiple init() warning tests', () => {
  let originalConsoleWarn: typeof console.warn;
  let consoleWarnMock: jest.Mock;

  beforeEach(() => {
    // Mock console.warn to capture warning output
    originalConsoleWarn = console.warn;
    consoleWarnMock = jest.fn();
    console.warn = consoleWarnMock;

    // Clear init history before each test
    const history = _getInitHistory();
    history.length = 0;
  });

  afterEach(() => {
    // Restore console.warn
    console.warn = originalConsoleWarn;

    // Clear init history after each test
    const history = _getInitHistory();
    history.length = 0;
  });

  describe('Warning behavior', () => {
    test('should NOT show warning on first init() call', () => {
      init({ apiKey: 'test-key-123', otelSetup: false });

      expect(consoleWarnMock).not.toHaveBeenCalled();
    });

    test('should NOT show warning when calling init() multiple times with identical config', () => {
      const config = { apiKey: 'test-key-123', otelSetup: false };

      init(config);
      init(config);
      init(config);

      expect(consoleWarnMock).not.toHaveBeenCalled();
    });

    test('should show warning when calling init() with different config', () => {
      init({ apiKey: 'test-key-123', otelSetup: false });
      init({ apiKey: 'different-key-456', otelSetup: false });

      expect(consoleWarnMock).toHaveBeenCalled();
      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Check that the warning contains expected elements
      expect(warningOutput).toContain('Multiple Initialization Detected');
      expect(warningOutput).toContain('GT_MultipleInitWarning');
      expect(warningOutput).toContain('2 times');
    });

    test('should show correct diff when apiKey changes', () => {
      init({ apiKey: 'test-key-123', otelSetup: false });
      init({ apiKey: 'different-key-456', otelSetup: false });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Check for masked API keys in diff
      expect(warningOutput).toContain('apiKey:');
      expect(warningOutput).toContain('test-k***');
      expect(warningOutput).toContain('differ***');
    });

    test('should show correct diff when adding new config options', () => {
      init({ apiKey: 'test-key-123', otelSetup: false });
      init({
        apiKey: 'test-key-123',
        otelSetup: false,
        baseURL: 'https://gentrace.ai/api',
        timeout: 5000,
      });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Check for added options
      expect(warningOutput).toContain('baseURL:');
      expect(warningOutput).toContain('+ "https://gentrace.ai/api"');
      expect(warningOutput).toContain('timeout:');
      expect(warningOutput).toContain('+ 5000');
    });

    test('should show correct diff when removing config options', () => {
      init({
        apiKey: 'test-key-123',
        otelSetup: false,
        baseURL: 'https://gentrace.ai/api',
      });
      init({ apiKey: 'test-key-123', otelSetup: false });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Check for removed options
      expect(warningOutput).toContain('baseURL:');
      expect(warningOutput).toContain('- "https://gentrace.ai/api"');
    });

    test('should show correct diff for changed boolean values', () => {
      init({ apiKey: 'test-key-123', otelSetup: true });
      init({ apiKey: 'test-key-123', otelSetup: false });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      expect(warningOutput).toContain('otelSetup:');
      expect(warningOutput).toContain('- true → false');
    });

    test('should track multiple init calls in history', () => {
      init({ apiKey: 'key1', otelSetup: false });
      init({ apiKey: 'key2', otelSetup: false });
      init({ apiKey: 'key3', otelSetup: false });

      // Should have shown warnings for the 2nd and 3rd calls
      expect(consoleWarnMock).toHaveBeenCalledTimes(2);

      // Check the second warning (3rd init call)
      const secondWarning = consoleWarnMock.mock.calls[1]?.[0] || '';
      expect(secondWarning).toContain('3 times');
      expect(secondWarning).toContain('Call #1:');
      expect(secondWarning).toContain('Call #2:');
    });
  });

  describe('Sensitive value masking', () => {
    test('should mask various sensitive keys', () => {
      // Use type assertion to test additional sensitive properties
      const config1: any = {
        apiKey: 'sensitive-api-key-12345',
        otelSetup: false,
      };

      const config2: any = {
        apiKey: 'different-api-key-67890',
        authToken: 'auth-token-abcdef',
        secretKey: 'my-secret-key',
        password: 'supersecret',
        otelSetup: false,
      };

      init(config1);
      init(config2);

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // API key should be masked
      expect(warningOutput).toContain('sensit***');
      expect(warningOutput).toContain('differ***');

      // Additional sensitive keys should be masked
      expect(warningOutput).toContain('authToken:');
      expect(warningOutput).toContain('+ "auth-t***"');
      expect(warningOutput).toContain('secretKey:');
      expect(warningOutput).toContain('+ "my-sec***"');
      expect(warningOutput).toContain('password:');
      expect(warningOutput).toContain('+ "supers***"');

      // Should not contain full sensitive values
      expect(warningOutput).not.toContain('sensitive-api-key-12345');
      expect(warningOutput).not.toContain('different-api-key-67890');
      expect(warningOutput).not.toContain('auth-token-abcdef');
    });

    test('should mask short sensitive values completely', () => {
      init({ apiKey: 'short', otelSetup: false });
      init({ apiKey: 'tiny', otelSetup: false });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Short values should be completely masked
      expect(warningOutput).toContain('***');
      expect(warningOutput).not.toContain('short');
      expect(warningOutput).not.toContain('tiny');
      // The diff should show both values as masked
      expect(warningOutput).toContain('"***" → "***"');
    });
  });

  describe('Complex object handling', () => {
    test('should handle object values in config', () => {
      init({
        apiKey: 'test',
        otelSetup: { serviceName: 'test-service' },
      });
      init({
        apiKey: 'test',
        otelSetup: { serviceName: 'prod-service', debug: true },
      });

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      // Should show object summary
      expect(warningOutput).toContain('otelSetup:');
      expect(warningOutput).toContain('{ serviceName }');
      expect(warningOutput).toContain('{ serviceName, debug }');
    });

    test('should handle array values in config', () => {
      // Use type assertion to test array handling
      const config1: any = {
        apiKey: 'test',
        otelSetup: false,
        customArray: ['http', 'grpc'],
      };

      const config2: any = {
        apiKey: 'test',
        otelSetup: false,
        customArray: ['http', 'grpc', 'aws'],
      };

      init(config1);
      init(config2);

      const warningOutput = consoleWarnMock.mock.calls[0]?.[0] || '';

      expect(warningOutput).toContain('customArray:');
      expect(warningOutput).toContain('[Array(2)]');
      expect(warningOutput).toContain('[Array(3)]');
    });
  });
});
