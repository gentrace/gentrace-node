import type { SetupConfig } from './otel/types';

let _isInitialized = false;
let _otelSetupConfig: boolean | SetupConfig | undefined = undefined;

/**
 * Returns whether init() has been called
 * @internal
 */
export function _isGentraceInitialized(): boolean {
  return _isInitialized;
}

/**
 * Sets the initialization state
 * @internal
 */
export function _setGentraceInitialized(value: boolean): void {
  _isInitialized = value;
}

/**
 * Returns the otelSetup configuration passed to init()
 * @internal
 */
export function _getOtelSetupConfig(): boolean | SetupConfig | undefined {
  return _otelSetupConfig;
}

/**
 * Sets the otelSetup configuration
 * @internal
 */
export function _setOtelSetupConfig(value: boolean | SetupConfig | undefined): void {
  _otelSetupConfig = value;
}
