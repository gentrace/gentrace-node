import { ClientOptions } from '../client';
import { Datasets, Experiments, Pipelines, TestCases } from '../resources';
import { _getClient, _setClient } from './client-instance';
import type { SetupConfig } from './otel/setup';
import type { Sampler } from '@opentelemetry/sdk-trace-base';
import type { Instrumentation } from '@opentelemetry/instrumentation';

// Module-level variable to track initialization state
let _isInitialized = false;

/**
 * Returns whether init() has been called
 * @internal
 */
export function _isGentraceInitialized(): boolean {
  return _isInitialized;
}

/**
 * Configuration options for initializing Gentrace
 */
export interface InitOptions extends ClientOptions {
  /**
   * Whether to automatically configure OpenTelemetry. Defaults to true.
   * Set to false if you want to manually configure OpenTelemetry.
   */
  autoConfigureOtel?: boolean;

  /**
   * Optional OpenTelemetry trace endpoint URL.
   * Only used if autoConfigureOtel is true.
   * Defaults to Gentrace's OTLP endpoint.
   */
  traceEndpoint?: string;

  /**
   * Optional service name for the application.
   * Only used if autoConfigureOtel is true.
   * Defaults to the package name from package.json or 'unknown-service'
   */
  serviceName?: string;

  /**
   * Optional instrumentations to include (e.g., OpenAI, Anthropic)
   * Only used if autoConfigureOtel is true.
   */
  instrumentations?: Instrumentation[];

  /**
   * Optional additional resource attributes
   * Only used if autoConfigureOtel is true.
   */
  resourceAttributes?: Record<string, string | number | boolean>;

  /**
   * Optional custom sampler
   * Only used if autoConfigureOtel is true.
   */
  sampler?: Sampler;

  /**
   * Whether to include console exporter for debugging
   * Only used if autoConfigureOtel is true.
   * Defaults to false.
   */
  debug?: boolean;
}

/**
 * Initializes the global Gentrace state and optionally configures OpenTelemetry.
 * **Must** be called early in your application setup to configure the SDK globally
 * with API keys, base URLs, or other settings. Gentrace functionality depends on this initialization.
 *
 * By default, this function also automatically configures OpenTelemetry for tracing.
 * You can disable this by setting `autoConfigureOtel: false`.
 *
 * @param {InitOptions} [options={}] - Configuration options.
 * @example
 * ```typescript
 * import { init, GentraceSampler } from '@gentrace/core';
 *
 * // Simple usage - automatically configures OpenTelemetry
 * init({
 *   apiKey: 'your-gentrace-api-key'
 * });
 *
 * // With custom OpenTelemetry configuration
 * init({
 *   apiKey: 'your-gentrace-api-key',
 *   sampler: new GentraceSampler(),
 *   serviceName: 'my-service',
 *   resourceAttributes: {
 *     environment: 'production'
 *   }
 * });
 *
 * // Disable automatic OpenTelemetry setup
 * init({
 *   apiKey: 'your-gentrace-api-key',
 *   autoConfigureOtel: false
 * });
 * ```
 */
export function init(options: InitOptions = {}) {
  // Extract OpenTelemetry config from options
  const {
    autoConfigureOtel = true,
    traceEndpoint,
    serviceName,
    instrumentations,
    resourceAttributes,
    sampler,
    debug,
    ...clientOptions
  } = options;

  // Always use _setClient to ensure the constructor logic is run
  // for creating or potentially updating the client instance.
  _setClient(clientOptions);

  // Set module-level flag to indicate that init() has been called
  _isInitialized = true;

  // Re-assign the module-scope variables based on the latest client.
  // Importers with live bindings will now see these new values.
  _updateExports();

  // Automatically configure OpenTelemetry unless disabled
  if (autoConfigureOtel) {
    // Lazy import to avoid circular dependencies
    const { setup } = require('./otel/setup');

    const setupConfig: SetupConfig = {};
    if (traceEndpoint !== undefined) setupConfig.traceEndpoint = traceEndpoint;
    if (serviceName !== undefined) setupConfig.serviceName = serviceName;
    if (instrumentations !== undefined) setupConfig.instrumentations = instrumentations;
    if (resourceAttributes !== undefined) setupConfig.resourceAttributes = resourceAttributes;
    if (sampler !== undefined) setupConfig.sampler = sampler;
    if (debug !== undefined) setupConfig.debug = debug;

    setup(setupConfig);
  }
}

const client = _getClient();
let pipelines: Pipelines = client.pipelines;
let experiments: Experiments = client.experiments;
let datasets: Datasets = client.datasets;
let testCases: TestCases = client.testCases;

/**
 * Updates the exported namespace variables to point to the current client's namespaces.
 * This function is called after the client is potentially created or updated.
 */
function _updateExports() {
  const client = _getClient();
  pipelines = client.pipelines;
  experiments = client.experiments;
  datasets = client.datasets;
  testCases = client.testCases;
}

// Export the module-scope variables. Importers get live bindings to these.
export { datasets, experiments, pipelines, testCases };
