import { ClientOptions } from '../client';
import { _getClient, _setClient } from './client-instance';
import { GentraceState, _setGlobalState } from './state';

/**
 * Initializes the global Gentrace state.
 * **Must** be called early in your application setup to configure the SDK globally
 * with API keys, base URLs, or other settings. Gentrace functionality depends on this initialization.
 *
 * @param {ClientOptions} [options={}] - New configuration options.
 */
export function init(options: ClientOptions = {}) {
  const state = new GentraceState(options);
  _setGlobalState(state);

  // Always use _setClient to ensure the constructor logic is run
  // for creating or potentially updating the client instance.
  _setClient(options);

  // Re-assign the module-scope variables based on the latest client.
  // Importers with live bindings will now see these new values.
  _updateExports();

  return state;
}

const client = _getClient();
let pipelines = client.pipelines;
let experiments = client.experiments;
let datasets = client.datasets;
let testCases = client.testCases;

/**
 * Updates the exported namespace variables to point to the current client's namespaces.
 * This function is called after the client is potentially created or updated.
 */
function _updateExports() {
  const client = _getClient(); // Get the most current client instance
  pipelines = client.pipelines;
  experiments = client.experiments;
  datasets = client.datasets;
  testCases = client.testCases;
}

// Export the module-scope variables. Importers get live bindings to these.
export { datasets, experiments, pipelines, testCases };
