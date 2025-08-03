import chalk from 'chalk';
import { highlight } from 'cli-highlight';
import { trace } from '@opentelemetry/api';
import { isDeepStrictEqual } from 'util';
import { _getOtelSetupConfig } from './init-state';
import { _getClient } from './client-instance';
import { GentraceWarnings } from './warnings';

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
  let warning;

  switch (errorType) {
    case 'invalid-format':
      warning = GentraceWarnings.PipelineInvalidError(pipelineId);
      break;
    case 'not-found':
      warning = GentraceWarnings.PipelineNotFoundError(pipelineId);
      break;
    case 'unauthorized':
      warning = GentraceWarnings.PipelineUnauthorizedError(pipelineId);
      break;
    case 'unknown':
      warning = GentraceWarnings.PipelineError(pipelineId, error?.message);
      break;
  }

  warning.display();
}

/**
 * Validates that a pipeline ID is accessible with the current API key.
 * Only checks once per pipeline ID to avoid redundant API calls.
 */
export async function validatePipelineAccess(
  pipelineId: string,
  suppressWarnings: boolean = false,
): Promise<void> {
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

    // Only show warning once per pipeline (and only if not suppressed)
    if (!suppressWarnings && !_pipelineWarningIssued.has(pipelineId)) {
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
  const warning = GentraceWarnings.OtelNotConfiguredError();
  warning.display();

  // Show code examples
  try {
    // Option 1: Automatic setup
    const autoSetupCode = `import { init } from 'gentrace';

// Enable automatic OpenTelemetry setup (default behavior)
init({
  apiKey: process.env.GENTRACE_API_KEY,
});`;

    // Option 2: Manual setup
    const manualSetupCode = `import { init } from 'gentrace';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
// For OpenTelemetry v1, use: import { Resource } from '@opentelemetry/resources';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// First initialize Gentrace with otelSetup: false
init({
  apiKey: process.env.GENTRACE_API_KEY,
  otelSetup: false,
});

// Then manually configure OpenTelemetry SDK
const sdk = new NodeSDK({
  // For OpenTelemetry v2:
  resource: resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: 'your-service-name',
  }),
  // For OpenTelemetry v1, use: resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'your-service-name' }),
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

    console.log(
      chalk.green.bold("\n⭐ Option 1: Use Gentrace's automatic OpenTelemetry setup (recommended):\n"),
    );

    let highlightedAutoCode;
    try {
      highlightedAutoCode = highlight(autoSetupCode, { language: 'javascript', ignoreIllegals: true });
    } catch (error) {
      highlightedAutoCode = chalk.cyan(autoSetupCode);
    }
    console.log(highlightedAutoCode);

    console.log(
      chalk.gray('\n\nOption 2: If you have otelSetup: false, manually configure OpenTelemetry:\n'),
    );

    let highlightedManualCode;
    try {
      highlightedManualCode = highlight(manualSetupCode, { language: 'javascript', ignoreIllegals: true });
    } catch (error) {
      highlightedManualCode = chalk.cyan(manualSetupCode);
    }
    console.log(highlightedManualCode);

    console.log('\n' + chalk.gray('Tip: Copy the code above and add it to your application setup.\n'));

    if (!warning.suppressionHint) {
      console.log(
        chalk.dim('To suppress this warning: Set suppressWarnings: true in your Gentrace configuration\n'),
      );
    }
  } catch (error) {
    // Code examples failed to display, but warning was already shown
  }
}

/**
 * Run an array of async task functions with a concurrency limit.
 * Similar to Python's asyncio.Semaphore but for JavaScript Promises.
 *
 * @param tasks Array of functions that return promises
 * @param maxConcurrency Maximum number of tasks to run simultaneously
 * @returns Promise that resolves with array of results in the same order as input tasks
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (!task) {
      continue;
    }

    // Start the task and add it to results array at the correct index
    const promise = task().then((result) => {
      results[i] = result;
    });

    // Create the promise first to avoid circular reference
    const p = promise.then(() => {
      // Remove this promise from the executing array once complete
      const index = executing.indexOf(p);
      if (index !== -1) {
        executing.splice(index, 1);
      }
    });

    // Then add it to the executing array
    executing.push(p);

    // If we've reached the concurrency limit, wait for one to complete
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining tasks to complete
  await Promise.all(executing);

  return results;
}

/**
 * Generates a diff between two configuration objects
 * @param previousConfig The previous configuration
 * @param currentConfig The current configuration
 * @returns Array of formatted diff lines
 */
export function generateConfigDiff(previousConfig: any, currentConfig: any): string[] {
  const diffLines: string[] = [];
  const allKeys = new Set([...Object.keys(previousConfig || {}), ...Object.keys(currentConfig || {})]);

  for (const key of allKeys) {
    const prevValue = previousConfig?.[key];
    const currValue = currentConfig?.[key];

    // Handle sensitive keys generically
    const displayPrev = maskSensitiveValue(key, prevValue);
    const displayCurr = maskSensitiveValue(key, currValue);

    if (prevValue === undefined && currValue !== undefined) {
      // Added
      diffLines.push(`  ${key}:`);
      diffLines.push(`    + ${formatValue(displayCurr)}`);
    } else if (prevValue !== undefined && currValue === undefined) {
      // Removed
      diffLines.push(`  ${key}:`);
      diffLines.push(`    - ${formatValue(displayPrev)}`);
    } else if (!isDeepStrictEqual(prevValue, currValue)) {
      // Changed
      diffLines.push(`  ${key}:`);
      diffLines.push(`    - ${formatValue(displayPrev)} → ${formatValue(displayCurr)}`);
    }
  }

  return diffLines;
}

/**
 * Formats a value for display in the diff
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'function') return '<function>';
  if (typeof value === 'object') {
    // For objects, show a summary
    if (Array.isArray(value)) return `[Array(${value.length})]`;
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    if (keys.length <= 3) return `{ ${keys.join(', ')} }`;
    return `{ ${keys.slice(0, 3).join(', ')}, ... }`;
  }
  return String(value);
}

/**
 * Masks sensitive values based on key patterns
 */
export function maskSensitiveValue(key: string, value: any): any {
  const sensitivePatterns = [
    /key/i,
    /token/i,
    /secret/i,
    /password/i,
    /auth/i,
    /credential/i,
    /apikey/i,
    /api_key/i,
  ];

  if (typeof value === 'string' && sensitivePatterns.some((pattern) => pattern.test(key))) {
    // Show first 6 chars and mask the rest
    if (value.length > 10) {
      return `${value.substring(0, 6)}***`;
    }
    return '***';
  }

  return value;
}
