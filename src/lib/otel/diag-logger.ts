import { DiagLogger } from '@opentelemetry/api';
import { GentraceWarnings, GentraceWarning } from '../warnings';
import { _getClient } from '../client-instance';
import { loggerFor } from '../../internal/utils/log';

/**
 * Custom diagnostic logger for OpenTelemetry that intercepts warnings
 * and displays them using Gentrace's warning system.
 *
 * This logger specifically looks for partial success warnings from the
 * OTLP exporter and displays them using the GT_OtelPartialFailureWarning.
 */
export class GentraceDiagLogger implements DiagLogger {
  private client = _getClient();
  private logger = loggerFor(this.client);

  constructor() {}

  error(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    // Intercept partial success warnings from OTLP exporter
    if (message.includes('Received Partial Success response:')) {
      // Check if we've already displayed a partial success warning
      const warningKey = 'GT_OtelPartialFailureWarning';
      if (!GentraceWarning.hasBeenDisplayed(warningKey)) {
        // The partial success data is passed as the first argument
        const partialSuccessJson = args[0] as string;
        try {
          const partialSuccess = JSON.parse(partialSuccessJson);

          // Mark this warning as displayed
          GentraceWarning.markAsDisplayed(warningKey);

          // Convert rejectedSpans to number (it comes as a string from the server)
          const rejectedCount = partialSuccess.rejectedSpans ? Number(partialSuccess.rejectedSpans) : 0;

          // Use Gentrace's warning system to display the partial failure
          const warning = GentraceWarnings.OtelPartialFailureWarning(
            rejectedCount,
            partialSuccess.errorMessage,
          );
          warning.display();
        } catch (e) {
          // If we can't parse the partial success, fall back to regular logging
          this.logger.warn(message, ...args);
        }
      }
      // Log raw message at debug level for programmatic access
      this.logger.debug(message, ...args);
    } else {
      // Other warnings go directly to logger
      this.logger.warn(message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  verbose(message: string, ...args: unknown[]): void {
    // Map verbose to debug as Stainless has no verbose level
    this.logger.debug(message, ...args);
  }
}
