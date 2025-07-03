import { ClientOptions } from '../client';
import { Datasets, Experiments, Pipelines, TestCases } from '../resources';
import { _getClient, _setClient } from './client-instance';
import type { SetupConfig } from './otel/types';
import { setup } from './otel/setup';
import {
  _setGentraceInitialized,
  _setOtelSetupConfig,
  _isGentraceInitialized,
  _getOtelSetupConfig,
} from './init-state';
import { NodeSDK } from '@opentelemetry/sdk-node';

// Re-export for backwards compatibility
export { _isGentraceInitialized, _getOtelSetupConfig };

/**
 * Configuration options for initializing Gentrace
 */
export interface InitOptions extends ClientOptions {
  /**
   * OpenTelemetry setup configuration. Defaults to true (automatic setup with defaults).
   * - Set to false to disable automatic OpenTelemetry configuration
   * - Set to true to use default configuration
   * - Set to an object to provide custom configuration
   */
  otelSetup?: boolean | SetupConfig;
}

/**
 * Initializes the global Gentrace state and optionally configures OpenTelemetry.
 * **Must** be called early in your application setup to configure the SDK globally
 * with API keys, base URLs, or other settings. Gentrace functionality depends on this initialization.
 *
 * By default, this function also automatically configures OpenTelemetry for tracing.
 * You can disable this by setting `otelSetup: false`.
 *
 * @param {InitOptions} [options={}] - Configuration options.
 * @example
 * ```typescript
 * import { init, GentraceSampler } from '@gentrace/core';
 *
 * // Simple usage - automatically configures OpenTelemetry
 * await init({
 *   apiKey: 'your-gentrace-api-key'
 * });
 *
 * // With custom OpenTelemetry configuration
 * await init({
 *   apiKey: 'your-gentrace-api-key',
 *   otelSetup: {
 *     sampler: new GentraceSampler(),
 *     serviceName: 'my-service',
 *     resourceAttributes: {
 *       environment: 'production'
 *     }
 *   }
 * });
 *
 * // Disable automatic OpenTelemetry setup, no need to await
 * init({
 *   apiKey: 'your-gentrace-api-key',
 *   otelSetup: false
 * });
 * ```
 */
export function init(options: InitOptions = {}): NodeSDK | void {
  // Extract OpenTelemetry config from options
  const { otelSetup = true, ...clientOptions } = options;

  // Always use _setClient to ensure the constructor logic is run
  // for creating or potentially updating the client instance.
  _setClient(clientOptions);

  // Set module-level flag to indicate that init() has been called
  _setGentraceInitialized(true);

  // Store the otelSetup configuration
  _setOtelSetupConfig(otelSetup);

  // Re-assign the module-scope variables based on the latest client.
  // Importers with live bindings will now see these new values.
  _updateExports();

  // Handle OpenTelemetry setup based on otelSetup value
  if (otelSetup !== false) {
    // If otelSetup is true, use empty config (defaults)
    // If otelSetup is an object, use it as the config
    const setupConfig: SetupConfig = otelSetup === true ? {} : otelSetup;

    return setup(setupConfig);
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
