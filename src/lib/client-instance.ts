import { readEnv } from 'gentrace/internal/utils';
import { Gentrace, ClientOptions } from '../client';

/**
 * Singleton instance of the Gentrace client used to expose namespace methods.
 * Initialized with the API key from environment variables or a placeholder value.
 * This instance is used throughout the SDK for making API calls to Gentrace.
 */
let _client = new Gentrace({
  bearerToken: readEnv('GENTRACE_API_KEY') ?? 'placeholder',
});

export function _getClient() {
  return _client;
}

export function _setClient(options: ClientOptions) {
  _client = new Gentrace(options);
}
