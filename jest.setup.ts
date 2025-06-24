// Set the dummy API key early
process.env['GENTRACE_API_KEY'] = 'test-api-key';

// Mock OpenTelemetry setup to prevent initialization errors in tests
jest.mock('./src/lib/otel/setup', () => ({
  setup: jest.fn().mockResolvedValue({
    start: jest.fn(),
    shutdown: jest.fn(),
  }),
}));
