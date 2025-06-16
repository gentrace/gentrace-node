import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import type { ContextManager } from '@opentelemetry/api';
import type { SpanExporter, SpanProcessor, Sampler } from '@opentelemetry/sdk-trace-base';
import type { Instrumentation } from '@opentelemetry/instrumentation';

export interface GentraceOtelConfig {
  /**
   * Service name for the application
   */
  serviceName: string;

  /**
   * Optional Gentrace API key (defaults to GENTRACE_API_KEY env var)
   */
  apiKey?: string;

  /**
   * Optional Gentrace base URL (defaults to https://gentrace.ai/api)
   */
  baseUrl?: string;

  /**
   * Optional additional resource attributes
   */
  resourceAttributes?: Record<string, string | number | boolean>;

  /**
   * Optional custom sampler (defaults to GentraceSampler)
   */
  sampler?: Sampler;

  /**
   * Whether to include GentraceSampler (defaults to true)
   */
  useGentraceSampler?: boolean;

  /**
   * Additional span processors to include
   */
  additionalSpanProcessors?: SpanProcessor[];

  /**
   * Additional span exporters (will be wrapped in SimpleSpanProcessor)
   */
  additionalSpanExporters?: SpanExporter[];

  /**
   * Whether to include console exporter for debugging (defaults to false)
   */
  includeConsoleExporter?: boolean;

  /**
   * Optional instrumentations to include
   */
  instrumentations?: Instrumentation[];

  /**
   * Optional custom context manager
   */
  contextManager?: ContextManager;

  /**
   * Additional NodeSDK configuration options
   */
  additionalConfig?: Partial<NodeSDKConfiguration>;
}

/**
 * Sets up OpenTelemetry with Gentrace configuration
 *
 * This function provides a convenient wrapper around OpenTelemetry setup,
 * automatically configuring the Gentrace sampler, span processor, and exporter.
 * It uses dynamic imports to support both OpenTelemetry v1 and v2.
 *
 * @param config Configuration options for OpenTelemetry setup
 * @returns Promise that resolves to the initialized NodeSDK instance
 *
 * @example
 * ```typescript
 * import { setupOpenTelemetry } from '@gentrace/core';
 *
 * const sdk = await setupOpenTelemetry({
 *   serviceName: 'my-service',
 *   includeConsoleExporter: process.env.NODE_ENV === 'development',
 * });
 *
 * // Your application code here
 *
 * // Graceful shutdown
 * process.on('SIGTERM', async () => {
 *   await sdk.shutdown();
 * });
 * ```
 */
export async function setupOpenTelemetry(config: GentraceOtelConfig): Promise<any> {
  // Dynamic imports to support both OpenTelemetry v1 and v2
  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { SimpleSpanProcessor, ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-base');
  const { AsyncLocalStorageContextManager } = await import('@opentelemetry/context-async-hooks');
  const resources = await import('@opentelemetry/resources');
  const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_SERVICE_NAMESPACE } =
    await import('@opentelemetry/semantic-conventions');

  // Import Gentrace components
  const { GentraceSampler } = await import('./sampler');
  const { GentraceSpanProcessor } = await import('./span-processor');

  // Get configuration values
  const apiKey = config.apiKey || process.env['GENTRACE_API_KEY'];
  const baseUrl = config.baseUrl || process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api';

  if (!apiKey) {
    throw new Error(
      'GENTRACE_API_KEY is required. Please provide it via config.apiKey or GENTRACE_API_KEY environment variable.',
    );
  }

  // Build resource attributes
  const resourceAttributes: Record<string, string | number | boolean> = {
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    ...config.resourceAttributes,
  };

  // Create resource
  const Resource = 'Resource' in resources ? resources.Resource : (resources as any).default.Resource;
  const resource = Resource.default().merge(new Resource(resourceAttributes));

  // Setup span processors
  const spanProcessors: SpanProcessor[] = [new GentraceSpanProcessor()];

  // Add Gentrace exporter
  const gentraceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/otel/v1/traces`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  spanProcessors.push(new SimpleSpanProcessor(gentraceExporter));

  // Add console exporter if requested
  if (config.includeConsoleExporter) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  // Add additional exporters
  if (config.additionalSpanExporters) {
    for (const exporter of config.additionalSpanExporters) {
      spanProcessors.push(new SimpleSpanProcessor(exporter));
    }
  }

  // Add additional processors
  if (config.additionalSpanProcessors) {
    spanProcessors.push(...config.additionalSpanProcessors);
  }

  // Setup sampler
  let sampler: Sampler | undefined;
  if (config.sampler) {
    sampler = config.sampler;
  } else if (config.useGentraceSampler !== false) {
    sampler = new GentraceSampler();
  }

  // Setup context manager
  const contextManager = config.contextManager || new AsyncLocalStorageContextManager().enable();

  // Create NodeSDK configuration
  const sdkConfig: any = {
    resource,
    spanProcessors,
    contextManager,
  };

  // Add optional properties
  if (sampler) {
    sdkConfig.sampler = sampler;
  }
  if (config.instrumentations) {
    sdkConfig.instrumentations = config.instrumentations;
  }

  // Merge additional config
  if (config.additionalConfig) {
    Object.assign(sdkConfig, config.additionalConfig);
  }

  // Create and start SDK
  const sdk = new NodeSDK(sdkConfig);
  await sdk.start();

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
