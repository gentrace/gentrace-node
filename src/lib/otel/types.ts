import type { Sampler } from '@opentelemetry/sdk-trace-base';
import type { Instrumentation } from '@opentelemetry/instrumentation';

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
   * Optional custom sampler
   */
  sampler?: Sampler;
}
