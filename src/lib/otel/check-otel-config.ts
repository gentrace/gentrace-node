import { trace } from '@opentelemetry/api';
import * as colors from 'yoctocolors';
import { _getClient } from '../client-instance';

// Global flag to ensure the warning is issued only once per session
let _otelConfigWarningIssued = false;

/**
 * Checks if a proper OpenTelemetry SDK TracerProvider is configured.
 * If not, issues a warning with a hyperlink to documentation.
 *
 * @description
 * This function verifies if OpenTelemetry is properly configured by attempting
 * to create a span. If the configuration is missing or incorrect, it displays
 * a warning message with a clickable link to the setup documentation.
 * The warning is only shown once per Node.js session.
 *
 * @example
 * // Call before using tracing features
 * checkOtelConfigAndWarn();
 */
export function checkOtelConfigAndWarn(): void {
  if (_otelConfigWarningIssued) {
    return;
  }

  const client = _getClient();
  const provider = trace.getTracerProvider();
  const tracer = provider.getTracer('gentrace-check');
  let isConfigured = false;

  try {
    tracer.startSpan('check-otel-config').end();
    isConfigured = true;
  } catch (e) {
    isConfigured = false;
  }

  if (!isConfigured) {
    const otelSetupUrl = 'https://github.com/gentrace/gentrace-node#opentelemetry-integration';

    try {
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
        colors.underline(`\x1b]8;;${otelSetupUrl}\x1b\\Gentrace OpenTelemetry Setup Guide\x1b]8;;\x1b\\`),
        '.',
      ].join('');

      client.logger?.warn(message);
    } catch (error) {
      const fallbackMessage =
        'Gentrace: OpenTelemetry SDK (TracerProvider) does not appear to be configured. ' +
        'Gentrace tracing features (e.g., @interaction, @traced, experiment(), and testDataset()) may not record data. ' +
        `Please ensure OpenTelemetry is set up as per the ${otelSetupUrl}.`;

      client.logger?.warn(fallbackMessage);
    }

    _otelConfigWarningIssued = true;
  }
}
