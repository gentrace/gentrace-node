import boxen from 'boxen';
import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import { _getOtelSetupConfig } from './init-state';

// Convert a string to snake_case
export function toSnakeCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s_]+/g, '_')
    .toLowerCase();
}

// Global flag to track if the OpenTelemetry warning has been issued
let _otelConfigWarningIssued = false;

/**
 * Checks if OpenTelemetry SDK is configured and warns if not.
 * Shows a formatted warning message with setup instructions.
 */
export function checkOtelConfigAndWarn(): void {
  // Only show warning once per session
  if (_otelConfigWarningIssued) {
    return;
  }

  // Check if otelSetup was configured in init()
  const otelSetupConfig = _getOtelSetupConfig();

  // Only show warning if otelSetup was explicitly set to false
  // If undefined, the user hasn't called init() yet
  // If true or an object, OpenTelemetry setup was requested
  if (otelSetupConfig !== false) {
    return;
  }

  try {
    // Try CommonJS require first
    const trace = require('@opentelemetry/api').trace;
    const tracerProvider = trace.getTracerProvider();

    // Check if the tracer provider is properly configured
    // ProxyTracerProvider with a delegate means SDK is configured
    const isSDKConfigured =
      tracerProvider &&
      // Direct SDK tracer provider (older versions)
      (typeof tracerProvider.register === 'function' ||
        // NodeTracerProvider or similar (check for expected methods)
        typeof tracerProvider.forceFlush === 'function' ||
        // ProxyTracerProvider with configured delegate (newer versions)
        (tracerProvider.constructor?.name === 'ProxyTracerProvider' && (tracerProvider as any)._delegate));

    if (!isSDKConfigured) {
      _otelConfigWarningIssued = true;
      displayOtelWarning();
    }
  } catch (requireError) {
    // If require fails (ESM environment), try dynamic import
    try {
      import('@opentelemetry/api')
        .then(({ trace }) => {
          const tracerProvider = trace.getTracerProvider();

          const isSDKConfigured =
            tracerProvider &&
            (typeof (tracerProvider as any).register === 'function' ||
              typeof (tracerProvider as any).forceFlush === 'function' ||
              (tracerProvider.constructor?.name === 'ProxyTracerProvider' &&
                (tracerProvider as any)._delegate));

          if (!isSDKConfigured && !_otelConfigWarningIssued) {
            _otelConfigWarningIssued = true;
            displayOtelWarning();
          }
        })
        .catch(() => {
          // If dynamic import also fails, OpenTelemetry API is not installed
          if (!_otelConfigWarningIssued) {
            _otelConfigWarningIssued = true;
            displayOtelWarning();
          }
        });
    } catch (importError) {
      // If even trying dynamic import fails, show warning
      if (!_otelConfigWarningIssued) {
        _otelConfigWarningIssued = true;
        displayOtelWarning();
      }
    }
  }
}

function displayOtelWarning(): void {
  try {
    const warningTitle = chalk.yellow.bold('⚠ Gentrace Configuration Warning');

    const warningMessage = `
OpenTelemetry SDK does not appear to be configured. This means that Gentrace features
like interaction(), evalOnce(), traced(), and evalDataset() will not record any data to the
Gentrace UI.

To fix this, add this code to the beginning of your application:
`;

    // Create code with PROPER JavaScript indentation
    const codeWithProperIndent = `import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Configure OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'your-service-name',
  }),
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://gentrace.ai/api/v1/otel/traces',
        headers: {
          Authorization: \`Bearer \${process.env.GENTRACE_API_KEY}\`,
        },
      })
    ),
  ],
});

// Start the SDK
sdk.start();`;

    // Try syntax highlighting with the properly indented code
    let highlightedCode;
    try {
      highlightedCode = highlight(codeWithProperIndent, { language: 'javascript', ignoreIllegals: true });
    } catch (error) {
      // Fallback to cyan if highlighting fails
      highlightedCode = chalk.cyan(codeWithProperIndent);
    }

    const fullMessage =
      warningMessage +
      '\n' +
      highlightedCode +
      '\n\n' +
      chalk.gray('Tip: Copy the code above and add it to your application setup.');

    console.log(
      '\n' +
        boxen(warningTitle + '\n' + fullMessage, {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
        }) +
        '\n',
    );
  } catch (error) {
    // Fallback to simple console warning if formatting libraries are not available
    console.warn(`
⚠ Gentrace Configuration Warning

OpenTelemetry SDK does not appear to be configured. This means that Gentrace features
like interaction(), evalOnce(), traced(), and evalDataset() will not record any data to the
Gentrace UI.

To fix this, add the OpenTelemetry SDK configuration code to your application.
See the documentation for the complete setup code.
`);
  }
}
