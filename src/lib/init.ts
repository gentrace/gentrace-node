import { ClientOptions } from '../client';
import { Datasets, Experiments, Pipelines, TestCases } from '../resources';
import { _getClient, _setClient } from './client-instance';

/**
 * Initializes the global Gentrace state.
 * **Must** be called early in your application setup to configure the SDK globally
 * with API keys, base URLs, or other settings. Gentrace functionality depends on this initialization.
 *
 * @param {ClientOptions} [options={}] - New configuration options.
 * @example
 * ```typescript
 * import { init } from 'gentrace';
 *
 * init({
 *   bearerToken: 'your-gentrace-api-key',
 *   baseURL: 'https://gentrace.ai/api' // optional
 * });
 * ```
 */
export function init(options: ClientOptions = {}) {
  // Always use _setClient to ensure the constructor logic is run
  // for creating or potentially updating the client instance.
  _setClient(options);

  // Re-assign the module-scope variables based on the latest client.
  // Importers with live bindings will now see these new values.
  _updateExports();
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
