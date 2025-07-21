import type { SetupConfig } from './otel/types';
import type { InitOptions } from './init';

export interface InitCall {
  timestamp: Date;
  options: InitOptions;
  callNumber: number;
  stackTrace: string | undefined;
}

let _isInitialized = false;
let _otelSetupConfig: boolean | SetupConfig | undefined = undefined;
let _initHistory: InitCall[] = [];

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

/**
 * Returns the initialization history
 * @internal
 */
export function _getInitHistory(): InitCall[] {
  return _initHistory;
}

/**
 * Adds a new init call to the history
 * @internal
 */
export function _addInitCall(options: InitOptions): void {
  const callNumber = _initHistory.length + 1;
  _initHistory.push({
    timestamp: new Date(),
    options: { ...options }, // Clone to preserve state
    callNumber,
    stackTrace: new Error().stack,
  });
}
