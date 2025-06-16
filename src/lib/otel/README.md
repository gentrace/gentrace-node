# OpenTelemetry Setup Wrapper

The `setupOpenTelemetry` function provides a convenient wrapper for setting up OpenTelemetry with Gentrace. It handles the complexity of configuring the SDK with all necessary Gentrace components while supporting both OpenTelemetry v1 and v2.

## Features

- **Dynamic imports**: Supports both OpenTelemetry v1 and v2 through dynamic imports
- **Automatic Gentrace configuration**: Sets up GentraceSampler and GentraceSpanProcessor by default
- **Flexible configuration**: Allows customization of all OpenTelemetry components
- **Built-in error handling**: Validates required configuration like API keys
- **TypeScript support**: Fully typed configuration options

## Basic Usage

```typescript
import { setupOpenTelemetry } from '@gentrace/core';

const sdk = await setupOpenTelemetry({
  serviceName: 'my-service',
});

// Your application code here

// Graceful shutdown
await sdk.shutdown();
```

## Configuration Options

### Required Options

- `serviceName`: The name of your service

### Optional Options

- `apiKey`: Gentrace API key (defaults to `GENTRACE_API_KEY` env var)
- `baseUrl`: Gentrace base URL (defaults to `https://gentrace.ai/api`)
- `resourceAttributes`: Additional resource attributes
- `sampler`: Custom sampler (defaults to GentraceSampler)
- `useGentraceSampler`: Whether to use GentraceSampler (defaults to true)
- `additionalSpanProcessors`: Additional span processors
- `additionalSpanExporters`: Additional span exporters
- `includeConsoleExporter`: Include console exporter for debugging
- `instrumentations`: OpenTelemetry instrumentations
- `contextManager`: Custom context manager
- `additionalConfig`: Additional NodeSDK configuration

## Advanced Example

```typescript
import { setupOpenTelemetry, createAIInstrumentations } from '@gentrace/core';
import { ParentBasedSampler, AlwaysOnSampler } from '@opentelemetry/sdk-trace-base';
import { GentraceSampler } from '@gentrace/core';

const sdk = await setupOpenTelemetry({
  serviceName: 'my-service',
  
  // Custom resource attributes
  resourceAttributes: {
    'service.version': '1.0.0',
    'deployment.environment': 'production',
  },
  
  // Custom sampler with parent-based sampling
  sampler: new ParentBasedSampler({
    root: new GentraceSampler(),
    remoteParentSampled: new AlwaysOnSampler(),
  }),
  
  // Include console output in development
  includeConsoleExporter: process.env.NODE_ENV === 'development',
  
  // AI library instrumentations
  instrumentations: await createAIInstrumentations(),
});
```

## Compatibility

The wrapper uses dynamic imports to ensure compatibility with both OpenTelemetry v1 and v2. The imports happen inside the function to avoid issues with peer dependencies.

## Migration from Manual Setup

If you're currently setting up OpenTelemetry manually, you can migrate to the wrapper:

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

### After (Using Wrapper)
```typescript
const sdk = await setupOpenTelemetry({
  serviceName: 'my-service',
});
```

The wrapper handles all the default configuration while still allowing full customization when needed.