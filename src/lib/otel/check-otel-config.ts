import { trace } from '@opentelemetry/api';
import * as colors from 'yoctocolors';
import { _getClient } from '../client-instance';

// Global flag to ensure the OpenTelemetry configuration warning is issued only once per session
let _otelConfigWarningIssued = false;

/**
 * Checks if a proper OpenTelemetry SDK TracerProvider is configured.
 * If not, issues a warning with a hyperlink to documentation.
 * The warning is issued only once per Node.js session.
 */
export function checkOtelConfigAndWarn(): void {
  if (_otelConfigWarningIssued) {
    return;
  }

  const client = _getClient();
  const provider = trace.getTracerProvider();

  // Check if the provider is the NoopTracerProvider (default when no SDK is configured)
  // We can't directly check the type as it's internal to OpenTelemetry
  // Instead, we check if a tracer from this provider creates spans with context
  const tracer = provider.getTracer('gentrace-check');
  let isConfigured = false;

  try {
    // Try to create a span and see if it has expected SDK methods
    // This is a heuristic approach since we can't directly check the provider type
    tracer.startSpan('check-otel-config').end();
    isConfigured = true;
  } catch (e) {
    // If an error occurs, the provider is likely not properly configured
    isConfigured = false;
  }

  if (!isConfigured) {
    const otelSetupUrl = 'https://github.com/gentrace/gentrace-node#opentelemetry-integration';

    try {
      // Format the warning message with colors and hyperlink
      const message = [
        colors.yellow('Gentrace: OpenTelemetry SDK (TracerProvider) does not appear to be configured.'),
        'Gentrace tracing features (e.g., ',
        colors.bgBlack(colors.white('@interaction')),
        ', ',
        colors.bgBlack(colors.white('@traced')),
        ', ',
        colors.bgBlack(colors.white('experiment()')),
        ', and ',
        colors.bgBlack(colors.white('testDataset()')),
        ') may not record data.',
        'Please ensure OpenTelemetry is set up as per the ',
        // Terminal hyperlink using ANSI escape sequences
        colors.underline(`\x1b]8;;${otelSetupUrl}\x1b\\Gentrace OpenTelemetry Setup Guide\x1b]8;;\x1b\\`),
        '.',
      ].join('');

      // Log the warning to the console
      client.logger?.warn(message);
    } catch (error) {
      // Fallback if fancy formatting fails
      const fallbackMessage =
        'Gentrace: OpenTelemetry SDK (TracerProvider) does not appear to be configured. ' +
        'Gentrace tracing features (e.g., @interaction, @traced, experiment(), and testDataset()) may not record data. ' +
        `Please ensure OpenTelemetry is set up as per the ${otelSetupUrl}.`;

      client.logger?.warn(fallbackMessage);
    }

    _otelConfigWarningIssued = true;
  }
}
