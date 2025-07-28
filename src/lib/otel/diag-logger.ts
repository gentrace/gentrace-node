import { DiagLogger } from '@opentelemetry/api';
import { GentraceWarnings } from '../warnings';

/**
 * Custom diagnostic logger for OpenTelemetry that intercepts warnings
 * and displays them using Gentrace's warning system.
 *
 * This logger specifically looks for partial success warnings from the
 * OTLP exporter and displays them using the GT_OtelPartialFailureWarning.
 */
export class GentraceDiagLogger implements DiagLogger {
  private displayedWarnings = new Set<string>();

  constructor(private debugMode: boolean = false) {}

  error(message: string, ...args: unknown[]): void {
    console.error(`[OpenTelemetry Error] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    // Intercept partial success warnings from OTLP exporter
    if (message.includes('Received Partial Success response:')) {
      // Check if we've already displayed a partial success warning
      const warningKey = 'partial-success';
      if (this.displayedWarnings.has(warningKey)) {
        // Log to console in debug mode but don't display the warning again
        if (this.debugMode) {
          console.warn(`[OpenTelemetry Warning] ${message}`, ...args);
        }
        return;
      }

      // The partial success data is passed as the first argument
      const partialSuccessJson = args[0] as string;
      try {
        const partialSuccess = JSON.parse(partialSuccessJson);

        // Mark this warning as displayed
        this.displayedWarnings.add(warningKey);

        // Convert rejectedSpans to number (it comes as a string from the server)
        const rejectedCount = partialSuccess.rejectedSpans ? Number(partialSuccess.rejectedSpans) : 0;

        // Use Gentrace's warning system to display the partial failure
        const warning = GentraceWarnings.OtelPartialFailureWarning(
          rejectedCount,
          partialSuccess.errorMessage,
        );
        warning.display();
      } catch (e) {
        // If we can't parse the partial success, fall back to console
        console.warn(`[OpenTelemetry Warning] ${message}`, ...args);
      }
    } else {
      // Other warnings go to console
      console.warn(`[OpenTelemetry Warning] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      console.info(`[OpenTelemetry Info] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      console.debug(`[OpenTelemetry Debug] ${message}`, ...args);
    }
  }

  verbose(message: string, ...args: unknown[]): void {
    if (this.debugMode) {
      console.debug(`[OpenTelemetry Verbose] ${message}`, ...args);
    }
  }
}
