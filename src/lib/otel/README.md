# OpenTelemetry Setup

The `setup` function provides the simplest way to initialize OpenTelemetry for use with Gentrace. With zero configuration required, it automatically sets up everything needed to send traces to Gentrace.

## Key Features

- **Zero Configuration**: Works out of the box with no parameters
- **Smart Defaults**: Automatically detects service name from package.json
- **Gentrace Integration**: Pre-configured with GentraceSampler and GentraceSpanProcessor
- **Automatic Shutdown**: Handles graceful shutdown on process exit (beforeExit, SIGTERM, SIGINT)
- **Dynamic Imports**: Compatible with both OpenTelemetry v1 and v2
- **TypeScript Support**: Fully typed for better developer experience
- **Flexible**: Override any default when needed

## Environment Variables

- `GENTRACE_API_KEY`: Required when using Gentrace endpoint
- `GENTRACE_BASE_URL`: Optional, defaults to `https://gentrace.ai/api`

## Basic Usage

```typescript
import { init, setup } from '@gentrace/core';

// First, initialize Gentrace with your API key
await init({
  apiKey: process.env.GENTRACE_API_KEY
});

// Then setup OpenTelemetry - no parameters needed!
await setup();

// Your application code here
```

## Configuration Options (All Optional)

- `traceEndpoint`: Custom OTLP trace endpoint (defaults to Gentrace's endpoint)
- `serviceName`: Service name (auto-detected from package.json by default)
- `instrumentations`: Array of OpenTelemetry instrumentations
- `resourceAttributes`: Additional resource attributes
- `sampler`: Custom sampler (defaults to GentraceSampler)
- `debug`: Enable console output for debugging (defaults to false)

## Common Use Cases

### Default Setup (Recommended)
```typescript
import { init, setup } from '@gentrace/core';

// Initialize Gentrace
await init({ apiKey: process.env.GENTRACE_API_KEY });

// Setup OpenTelemetry with zero configuration
await setup();
```

### Custom Trace Endpoint
```typescript
// Send traces to a local collector
await setup({
  traceEndpoint: 'http://localhost:4318/v1/traces'
});
```

### With Instrumentations
```typescript
// Add automatic instrumentation for AI libraries
await setup({
  instrumentations: [
    new OpenAIInstrumentation(),
    new AnthropicInstrumentation(),
  ]
});
```

### Debug Mode
```typescript
// Enable console output for debugging
await setup({
  debug: true
});
```

## Compatibility

The wrapper uses dynamic imports to ensure compatibility with both OpenTelemetry v1 and v2. The imports happen inside the function to avoid issues with peer dependencies.

## Migration from Manual Setup

If you're currently setting up OpenTelemetry manually, migration is simple:

### Before (Manual Setup)
```typescript
const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'my-service',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'https://gentrace.ai/api/otel/v1/traces',
    headers: {
      Authorization: `Bearer ${GENTRACE_API_KEY}`,
    },
  }),
  sampler: new GentraceSampler(),
  spanProcessors: [new GentraceSpanProcessor()],
  contextManager: new AsyncLocalStorageContextManager().enable(),
});
```

### After (Using setup)
```typescript
await init({ apiKey: process.env.GENTRACE_API_KEY });
await setup();
```

That's it! The setup function handles all the configuration automatically.