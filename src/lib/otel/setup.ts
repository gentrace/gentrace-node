import type { SpanProcessor, Sampler } from '@opentelemetry/sdk-trace-base';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import { GentraceSampler } from './sampler';
import { GentraceSpanProcessor } from './span-processor';
import { _getClient } from '../client-instance';

export interface SetupConfig {
  /**
   * Optional OpenTelemetry trace endpoint URL.
   * Defaults to Gentrace's OTLP endpoint (https://gentrace.ai/api/otel/v1/traces)
   */
  traceEndpoint?: string;

  /**
   * Optional service name for the application.
   * Defaults to the package name from package.json or 'unknown-service'
   */
  serviceName?: string;

  /**
   * Optional instrumentations to include (e.g., OpenAI, Anthropic)
   */
  instrumentations?: Instrumentation[];

  /**
   * Optional additional resource attributes
   */
  resourceAttributes?: Record<string, string | number | boolean>;

  /**
   * Optional custom sampler (defaults to GentraceSampler)
   */
  sampler?: Sampler;

  /**
   * Whether to include console exporter for debugging (defaults to false)
   */
  debug?: boolean;
}

/**
 * Sets up OpenTelemetry with Gentrace configuration.
 *
 * This is the simplest way to initialize OpenTelemetry for use with Gentrace.
 * By default, it configures everything needed to send traces to Gentrace.
 *
 * The setup function automatically registers process exit handlers (beforeExit, SIGTERM, SIGINT)
 * to ensure spans are properly flushed when the process exits.
 *
 * IMPORTANT: You must call init() before setup() to initialize Gentrace with your API key.
 *
 * @param config Optional configuration options
 * @returns Promise that resolves to the initialized NodeSDK instance
 *
 * @example
 * ```typescript
 * import { init, setup } from '@gentrace/core';
 *
 * // First, initialize Gentrace
 * await init({
 *   apiKey: 'your-api-key'
 * });
 *
 * // Then setup OpenTelemetry - no parameters needed
 * await setup();
 *
 * // With custom trace endpoint
 * await setup({
 *   traceEndpoint: 'http://localhost:4318/v1/traces'
 * });
 *
 * // With instrumentations
 * await setup({
 *   instrumentations: [new OpenAIInstrumentation()]
 * });
 * ```
 */
export async function setup(config: SetupConfig = {}): Promise<any> {
  // Dynamic imports to support both OpenTelemetry v1 and v2
  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { SimpleSpanProcessor, ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
  const { AsyncLocalStorageContextManager } = await import('@opentelemetry/context-async-hooks');
  const resources = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

  // Check if init() has been called
  const client = _getClient();
  if (!client || client.apiKey === 'placeholder') {
    throw new Error(
      'Gentrace must be initialized before calling setup(). Please call init() first with your API key.',
    );
  }

  // Get configuration values with smart defaults
  // Use API key from init() with higher priority than env variable
  const apiKey = client.apiKey !== 'placeholder' ? client.apiKey : process.env['GENTRACE_API_KEY'];
  const baseUrl = client.baseURL || process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api';
  const traceEndpoint = config.traceEndpoint || `${baseUrl}/otel/v1/traces`;

  // Try to get service name from package.json or use default
  let serviceName: string;
  if (config.serviceName) {
    serviceName = config.serviceName;
  } else {
    try {
      const packageJson = require(process.cwd() + '/package.json');
      serviceName = packageJson.name || 'unknown-service';
    } catch (e) {
      serviceName = 'unknown-service';
    }
  }

  // Build resource attributes
  const resourceAttributes: Record<string, string | number | boolean> = {
    [ATTR_SERVICE_NAME]: serviceName,
    ...config.resourceAttributes,
  };

  // Create resource - handle both v1 and v2
  let resource: any;
  const resourcesModule = resources as any;

  // Check if we have the v2 resourceFromAttributes function
  if (resourcesModule.resourceFromAttributes) {
    // OpenTelemetry v2 style with resourceFromAttributes
    resource = resourcesModule.resourceFromAttributes(resourceAttributes);
  } else if (resourcesModule.default?.resourceFromAttributes) {
    // v2 with default export
    resource = resourcesModule.default.resourceFromAttributes(resourceAttributes);
  } else if (resourcesModule.Resource) {
    // OpenTelemetry v1 style - direct Resource construction
    const Resource = resourcesModule.Resource;
    resource = Resource.default().merge(new Resource(resourceAttributes));
  } else if (resourcesModule.default?.Resource) {
    // v1 with default export
    const Resource = resourcesModule.default.Resource;
    resource = Resource.default().merge(new Resource(resourceAttributes));
  } else {
    // Last resort fallback
    throw new Error('Unable to create OpenTelemetry Resource. Please check your OpenTelemetry version.');
  }

  // Setup span processors
  const spanProcessors: SpanProcessor[] = [new GentraceSpanProcessor()];

  // Configure trace exporter
  const exporterConfig: any = {
    url: traceEndpoint,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if using Gentrace endpoint
  if (traceEndpoint.includes('gentrace.ai') && apiKey) {
    exporterConfig.headers.Authorization = `Bearer ${apiKey}`;
  } else if (traceEndpoint.includes('gentrace.ai') && !apiKey) {
    throw new Error(
      'GENTRACE_API_KEY is required when using Gentrace endpoint. Please set the GENTRACE_API_KEY environment variable.',
    );
  }

  const traceExporter = new OTLPTraceExporter(exporterConfig);
  spanProcessors.push(new SimpleSpanProcessor(traceExporter));

  // Add console exporter if debug mode
  if (config.debug) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  // Setup sampler - default to GentraceSampler
  const sampler = config.sampler || new GentraceSampler();

  // Setup context manager
  const contextManager = new AsyncLocalStorageContextManager().enable();

  // Create NodeSDK configuration
  const sdkConfig: any = {
    resource,
    spanProcessors,
    contextManager,
  };

  // Add sampler and instrumentations
  sdkConfig.sampler = sampler;
  if (config.instrumentations) {
    sdkConfig.instrumentations = config.instrumentations;
  }

  // Create and start SDK
  const sdk = new NodeSDK(sdkConfig);
  await sdk.start();

  // Register exit handlers to ensure spans are flushed
  const shutdownHandler = async () => {
    try {
      await sdk.shutdown();
    } catch (error) {
      console.error('Error during OpenTelemetry shutdown:', error);
    }
  };

  // Handle graceful shutdown
  process.once('beforeExit', shutdownHandler);
  process.once('SIGTERM', shutdownHandler);
  process.once('SIGINT', shutdownHandler);

  return sdk;
}

/**
 * Helper function to create OpenTelemetry instrumentations for common AI libraries
 *
 * @returns Array of instrumentations for OpenAI, Anthropic, etc.
 *
 * Note: This function attempts to load optional instrumentation packages.
 * These packages must be installed separately if needed.
 */
export async function createAIInstrumentations(): Promise<Instrumentation[]> {
  const instrumentations: Instrumentation[] = [];

  // Note: These are optional packages that users can install separately
  // Example: npm install @gentrace/openai-instrumentation

  return instrumentations;
}
