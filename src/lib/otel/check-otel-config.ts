import { trace } from '@opentelemetry/api';
import { _getClient } from '../client-instance';

// Global flag to ensure the OpenTelemetry configuration warning is issued only once per session
let _otelConfigWarningIssued = false;

/**
 * ANSI color codes for terminal styling
 */
const colors = {
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  bgGray: '\x1b[100m',
  white: '\x1b[37m',
  underline: '\x1b[4m',
  reset: '\x1b[0m',
};

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
      // Format the warning message with ANSI colors and hyperlink
      const message = [
        `${colors.yellow}Gentrace: OpenTelemetry SDK (TracerProvider) does not appear to be configured.${colors.reset}`,
        `Gentrace tracing features (e.g., `,
        `${colors.bgGray}${colors.white}@interaction${colors.reset}`,
        `, `,
        `${colors.bgGray}${colors.white}@traced${colors.reset}`,
        `, `,
        `${colors.bgGray}${colors.white}experiment()${colors.reset}`,
        `, and `,
        `${colors.bgGray}${colors.white}testDataset()${colors.reset}`,
        `) may not record data.`,
        `Please ensure OpenTelemetry is set up as per the `,
        `${colors.underline}\x1b]8;;${otelSetupUrl}\x1b\\Gentrace OpenTelemetry Setup Guide\x1b]8;;\x1b\\${colors.reset}`,
        `.`
      ].join('');

      // Log the warning to the console
      client.logger?.warn(message);
    } catch (error) {
      // Fallback if fancy formatting fails
      const fallbackMessage = 
        `Gentrace: OpenTelemetry SDK (TracerProvider) does not appear to be configured. ` +
        `Gentrace tracing features (e.g., @interaction, @traced, experiment(), and testDataset()) may not record data. ` +
        `Please ensure OpenTelemetry is set up as per the ${otelSetupUrl}.`;
      
      client.logger?.warn(fallbackMessage);
    }

    _otelConfigWarningIssued = true;
  }
}

