import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import boxen from 'boxen';
import { trace } from '@opentelemetry/api';
import { _getOtelSetupConfig } from './init-state';
import { _getClient } from './client-instance';

// Convert a string to snake_case
export function toSnakeCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s_]+/g, '_')
    .toLowerCase();
}

// UUID validation regex (accepts any valid UUID format)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate if a string is a valid UUID
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

// Cache for validated pipeline IDs
const _validatedPipelines = new Set<string>();
// Cache for pipelines that failed validation
const _invalidPipelines = new Set<string>();
// Flag to track if pipeline validation warning has been issued for a pipeline
const _pipelineWarningIssued = new Set<string>();

/**
 * Displays a beautifully formatted pipeline error message.
 */
export function displayPipelineError(
  pipelineId: string,
  errorType: 'invalid-format' | 'not-found' | 'unauthorized' | 'unknown',
  error?: any,
): void {
  try {
    let errorTitle: string;
    let errorMessage: string;
    let borderColor: string;

    switch (errorType) {
      case 'invalid-format':
        errorTitle = chalk.red.bold('Gentrace Invalid Pipeline ID');
        errorMessage = `Pipeline ID '${chalk.yellow(pipelineId)}' is not a valid UUID.

Please verify the pipeline ID matches what's shown in the Gentrace UI.`;
        borderColor = 'red';
        break;

      case 'not-found':
        errorTitle = chalk.red.bold('Gentrace Pipeline Not Found');
        errorMessage = `Pipeline '${chalk.yellow(pipelineId)}' does not exist or is not accessible.

Please verify the pipeline ID matches what's shown in the Gentrace UI.`;
        borderColor = 'red';
        break;

      case 'unauthorized':
        errorTitle = chalk.red.bold('Gentrace Pipeline Unauthorized');
        errorMessage = `Access denied to pipeline '${chalk.yellow(pipelineId)}'.

Please check your ${chalk.cyan('GENTRACE_API_KEY')} has the correct permissions.`;
        borderColor = 'red';
        break;

      case 'unknown':
        errorTitle = chalk.red.bold('Gentrace Pipeline Error');
        errorMessage = `Failed to validate pipeline '${chalk.yellow(pipelineId)}'.

Error: ${chalk.gray(error?.message || 'Unknown error')}`;
        borderColor = 'red';
        break;
    }

    console.error(
      '\n' +
        boxen(errorMessage, {
          title: errorTitle,
          titleAlignment: 'center',
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor,
        }) +
        '\n',
    );
  } catch (formatError) {
    // Fallback to simple console error if formatting fails
    console.error(
      chalk.red(
        `Gentrace Pipeline Error: ${
          errorType === 'invalid-format' ? `Invalid pipeline ID format '${pipelineId}'`
          : errorType === 'not-found' ? `Pipeline '${pipelineId}' not found`
          : errorType === 'unauthorized' ? `Unauthorized access to pipeline '${pipelineId}'`
          : `Failed to validate pipeline '${pipelineId}': ${error?.message || 'Unknown error'}`
        }`,
      ),
    );
  }
}

/**
 * Validates that a pipeline ID is accessible with the current API key.
 * Only checks once per pipeline ID to avoid redundant API calls.
 */
export async function validatePipelineAccess(pipelineId: string): Promise<void> {
  // Skip if already validated or invalid
  if (_validatedPipelines.has(pipelineId) || _invalidPipelines.has(pipelineId)) {
    return;
  }

  const client = _getClient();

  try {
    // Attempt to retrieve the pipeline to verify access
    await client.pipelines.retrieve(pipelineId);
    _validatedPipelines.add(pipelineId);
  } catch (error: any) {
    _invalidPipelines.add(pipelineId);

    // Only show warning once per pipeline
    if (!_pipelineWarningIssued.has(pipelineId)) {
      _pipelineWarningIssued.add(pipelineId);

      if (error?.status === 404) {
        displayPipelineError(pipelineId, 'not-found');
      } else if (error?.status === 401 || error?.status === 403) {
        displayPipelineError(pipelineId, 'unauthorized');
      } else {
        displayPipelineError(pipelineId, 'unknown', error);
      }
    }
  }
}

// Global flag to track if the OpenTelemetry warning has been issued
let _otelConfigWarningIssued = false;

/**
 * Checks if OpenTelemetry SDK is properly configured.
 * @returns {boolean} True if OpenTelemetry SDK is configured, false otherwise.
 * @internal
 */
export function isOtelConfigured(): boolean {
  try {
    const tracerProvider = trace.getTracerProvider();

    // Check if the tracer provider is properly configured
    // ProxyTracerProvider with a delegate means SDK is configured
    return !!(
      tracerProvider &&
      // Direct SDK tracer provider (older versions)
      (typeof (tracerProvider as any).register === 'function' ||
        // NodeTracerProvider or similar (check for expected methods)
        typeof (tracerProvider as any).forceFlush === 'function' ||
        // ProxyTracerProvider with configured delegate (newer versions)
        (tracerProvider.constructor?.name === 'ProxyTracerProvider' && (tracerProvider as any)._delegate))
    );
  } catch (error) {
    // If trace.getTracerProvider is not available or throws, OTEL is not configured
    return false;
  }
}

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

  const isSDKConfigured = isOtelConfigured();

  if (!isSDKConfigured) {
    _otelConfigWarningIssued = true;
    displayOtelWarning();
  }
}

function displayOtelWarning(): void {
  try {
    const warningTitle = chalk.yellow.bold('⚠ Gentrace Configuration Warning [GT_OtelNotConfiguredError]');

    const warningMessage = `
OpenTelemetry SDK does not appear to be configured. This means that Gentrace features
like interaction(), evalOnce(), traced(), and evalDataset() will not record any data to the
Gentrace UI.

Learn more: https://next.gentrace.ai/docs/sdk-reference/errors#gt_otelnotconfigurederror

You likely disabled automatic OpenTelemetry setup by passing otelSetup: false to init().
If so, you can fix this by either:

1. Remove the otelSetup: false option from init() to enable automatic setup:
`;

    // Create code with PROPER JavaScript indentation
    const codeWithProperIndent = `import { init } from 'gentrace';

// Enable automatic OpenTelemetry setup (default behavior)
init({
  apiKey: process.env.GENTRACE_API_KEY,
});

// 2. Or if you need manual setup, configure OpenTelemetry yourself:
import { init } from 'gentrace';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
// For OpenTelemetry v1, use: import { Resource } from '@opentelemetry/resources';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// First initialize Gentrace with otelSetup: false
init({
  apiKey: process.env.GENTRACE_API_KEY,
  otelSetup: false,
});

// Then manually configure OpenTelemetry SDK
const sdk = new NodeSDK({
  // For OpenTelemetry v2:
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'your-service-name',
  }),
  // For OpenTelemetry v1, use: resource: new Resource({ [ATTR_SERVICE_NAME]: 'your-service-name' }),
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://gentrace.ai/api/otel/v1/traces',
        headers: {
          Authorization: \`Bearer \${process.env.GENTRACE_API_KEY}\`,
        },
      })
    ),
    new SimpleSpanProcessor(new ConsoleSpanExporter()), // Optional: for debugging
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
      chalk.cyan(
        "Note: If you haven't set otelSetup: false, this could be a bundling or configuration issue.",
      ) +
      '\n';

    // Use separator lines instead of boxen for easier copying
    const separator = chalk.yellow('═'.repeat(80));
    const padding = '  '; // 2 spaces for horizontal padding

    // Add padding to each line of the full message
    const paddedMessage = fullMessage
      .split('\n')
      .map((line) => padding + line)
      .join('\n');

    console.log(`
${separator}
${padding}${warningTitle}
${separator}
${paddedMessage}
${separator}
`);
  } catch (error) {
    // Fallback to simple console warning if formatting libraries are not available
    console.warn(`
⚠ Gentrace Configuration Warning [GT_OtelNotConfiguredError]

OpenTelemetry SDK does not appear to be configured. This means that Gentrace features
like interaction(), evalOnce(), traced(), and evalDataset() will not record any data to the
Gentrace UI.

Learn more: https://next.gentrace.ai/docs/sdk-reference/errors#gt_otelnotconfigurederror

You likely disabled automatic OpenTelemetry setup by passing otelSetup: false to init().
To fix this, either remove the otelSetup: false option or manually configure OpenTelemetry.

If you haven't set otelSetup: false, this could be a bundling or configuration issue.
`);
  }
}
