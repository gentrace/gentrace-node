import { DiagLogLevel } from '@opentelemetry/api';
import type { LogLevel } from '../../internal/utils/log';

/**
 * Maps Stainless SDK LogLevel strings to OpenTelemetry DiagLogLevel enum values.
 *
 * The Stainless SDK uses lowercase string values for log levels:
 * - 'off': Disable all logging
 * - 'error': Log only errors
 * - 'warn': Log warnings and errors
 * - 'info': Log info, warnings, and errors
 * - 'debug': Log everything including debug messages
 *
 * OpenTelemetry uses numeric enum values:
 * - NONE (0): No logging
 * - ERROR (30): Error logging
 * - WARN (50): Warning logging
 * - INFO (60): Info logging
 * - DEBUG (70): Debug logging
 * - VERBOSE (80): Verbose logging (not used by Stainless)
 * - ALL (9999): All logging
 *
 * @param logLevel - The Stainless SDK log level string
 * @returns The corresponding OpenTelemetry DiagLogLevel enum value
 */
export function mapStainlessLogLevelToOTelDiagLevel(logLevel: LogLevel | undefined): DiagLogLevel {
  switch (logLevel) {
    case 'off':
      return DiagLogLevel.NONE;
    case 'error':
      return DiagLogLevel.ERROR;
    case 'warn':
      return DiagLogLevel.WARN;
    case 'info':
      return DiagLogLevel.INFO;
    case 'debug':
      return DiagLogLevel.DEBUG;
    default:
      // Default to WARN if logLevel is undefined or unrecognized
      return DiagLogLevel.WARN;
  }
}
