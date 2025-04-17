import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { detectResources, envDetector, resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Optional: For detailed OTEL debugging
// Set the global logger (optional)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

let sdk: NodeSDK | null = null;
let isShutdown = false;
let spanProcessor: BatchSpanProcessor | null = null;

// Define default attributes, can be overridden by env vars or config
const DEFAULT_SERVICE_NAME = 'gentrace';

interface GentraceOtelConfig {
  apiKey: string;
  baseURL: string;
  serviceName?: string;
  serviceVersion?: string;
  diagLogLevel?: DiagLogLevel;
  // Add more config options as needed: deploymentEnvironment, vcs info, etc.
}

export async function initializeGentraceOtel({
  apiKey,
  baseURL,
  serviceName = process.env['OTEL_SERVICE_NAME'] || DEFAULT_SERVICE_NAME,
  diagLogLevel,
}: GentraceOtelConfig): Promise<void> {
  if (sdk) {
    diag.warn('OpenTelemetry SDK already initialized.');
    return;
  }

  if (diagLogLevel !== undefined) {
    diag.setLogger(new DiagConsoleLogger(), diagLogLevel);
  }

  try {
    const baseResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    });

    const detectedResource = await detectResources({ detectors: [envDetector] });
    const resource = baseResource.merge(detectedResource);

    diag.debug('OTEL Resource:', resource.attributes);

    const exporter = new OTLPTraceExporter({
      url: `${baseURL}/api/otel/v1/traces`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    spanProcessor = new BatchSpanProcessor(exporter);

    const contextManager = new AsyncLocalStorageContextManager();
    contextManager.enable();

    sdk = new NodeSDK({
      resource: resource,
      spanProcessor: spanProcessor,
      contextManager: contextManager,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            // This automatic instrumentation causes lots of noise
            enabled: false,
          },
        }),
      ],
    });

    await sdk.start();
    diag.info('Gentrace OpenTelemetry SDK initialized successfully.');
    isShutdown = false;

    // Graceful shutdown handling
    setupShutdownListeners(); // Setup SIGTERM/beforeExit

    // Add handlers for critical errors after SDK setup
    process.on('uncaughtExceptionMonitor', (error: Error) => {
      diag.error('uncaughtExceptionMonitor caught exception:', error);
      // Attempt to flush telemetry before process potentially exits
      spanProcessor?.forceFlush().catch((flushErr) => {
        diag.error('Error flushing spans during uncaughtExceptionMonitor:', flushErr);
      });
    });

    process.on('unhandledRejection', (reason: unknown) => {
      diag.error('unhandledRejection caught:', reason);
      // Attempt to flush telemetry
      spanProcessor?.forceFlush().catch((flushErr) => {
        diag.error('Error flushing spans during unhandledRejection:', flushErr);
      });
    });
  } catch (error) {
    diag.error('Error initializing Gentrace OpenTelemetry SDK:', error);
    // Optionally re-throw or handle initialization failure
    throw error;
  }
}

function setupShutdownListeners() {
  const shutdown = async () => {
    if (isShutdown) {
      diag.debug('Shutdown already in progress.');
      return;
    }
    isShutdown = true;
    diag.info('Shutting down Gentrace OpenTelemetry SDK...');
    try {
      await sdk?.shutdown();
      diag.info('Gentrace OpenTelemetry SDK terminated successfully.');
    } catch (err) {
      diag.error('Error terminating Gentrace OpenTelemetry SDK:', err);
    } finally {
      // Ensure process exits even if shutdown fails in SIGTERM handler
      if (process.listenerCount('SIGTERM') === 1 && process.listeners('SIGTERM')[0] === boundShutdown) {
        process.exit(0);
      }
    }
  };

  // Bind `this` or ensure shutdown has access to `sdk` and `isShutdown`
  const boundShutdown = shutdown.bind(null);

  // Add listeners only once
  process.removeListener('SIGTERM', boundShutdown);
  process.removeListener('beforeExit', boundShutdown);

  process.once('SIGTERM', boundShutdown);
  process.once('beforeExit', boundShutdown); // Attempt graceful shutdown before exit
}

export async function shutdownGentraceOtel(): Promise<void> {
  if (isShutdown) {
    diag.debug('Shutdown already requested or completed.');
    return;
  }
  if (!sdk) {
    diag.warn('Attempted to shutdown OTEL SDK before initialization.');
    return;
  }
  isShutdown = true;
  diag.info('Explicitly shutting down Gentrace OpenTelemetry SDK...');
  try {
    await sdk.shutdown();
    diag.info('Gentrace OpenTelemetry SDK terminated successfully.');
  } catch (err) {
    diag.error('Error terminating Gentrace OpenTelemetry SDK:', err);
  }
}

// Consider exporting the tracer provider or a getTracer function if needed elsewhere
// import { trace } from '@opentelemetry/api';
// export const getTracer = () => trace.getTracer(DEFAULT_SERVICE_NAME, DEFAULT_SERVICE_VERSION);
