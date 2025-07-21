import chalk from 'chalk';
import boxen from 'boxen';

export interface GentraceWarningOptions {
  warningId: string;
  title: string;
  message: string | string[];
  learnMoreUrl?: string | null;
  suppressionHint?: string | null;
  borderColor?: string;
}

export class GentraceWarning {
  warningId: string;
  title: string;
  message: string[];
  learnMoreUrl?: string | null;
  suppressionHint?: string | null;
  borderColor: string;

  constructor(options: GentraceWarningOptions) {
    this.warningId = options.warningId;
    this.title = options.title;
    this.message = Array.isArray(options.message) ? options.message : [options.message];
    this.learnMoreUrl = options.learnMoreUrl ?? null;
    this.suppressionHint = options.suppressionHint ?? null;
    this.borderColor = options.borderColor || 'yellow';
  }

  getSimpleMessage(): string {
    return this.message.join(' ');
  }

  display(): void {
    try {
      // Build the formatted message
      const messageLines: string[] = [];

      // Add the main message
      for (const line of this.message) {
        messageLines.push(line);
      }

      // Add learn more URL if provided
      if (this.learnMoreUrl) {
        messageLines.push('');
        messageLines.push(`Learn more: ${chalk.cyan(this.learnMoreUrl)}`);
      }

      // Add suppression hint if provided
      if (this.suppressionHint) {
        messageLines.push('');
        messageLines.push(chalk.dim(this.suppressionHint));
      }

      const fullMessage = messageLines.join('\n');

      // Create the title with warning emoji and ID
      const formattedTitle = `⚠ ${this.title} [${this.warningId}]`;

      // Display using boxen
      console.warn(
        '\n' +
          boxen(fullMessage, {
            title:
              this.borderColor === 'red' ? chalk.red.bold(formattedTitle) : chalk.yellow.bold(formattedTitle),
            titleAlignment: 'center',
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: this.borderColor,
          }) +
          '\n',
      );
    } catch (error) {
      // Fallback to simple console warning if formatting fails
      console.warn(`⚠ ${this.title} [${this.warningId}]\n\n${this.getSimpleMessage()}\n`);
    }
  }
}

// Pre-defined warning types
export const GentraceWarnings = {
  PipelineInvalidError: (pipelineId: string) =>
    new GentraceWarning({
      warningId: 'GT_PipelineInvalidError',
      title: 'Gentrace Invalid Pipeline ID',
      message: [
        `Pipeline ID '${pipelineId}' is not a valid UUID.`,
        '',
        `Please verify the pipeline ID matches what's shown in the Gentrace UI.`,
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-pipelineinvaliderror',
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
      borderColor: 'red',
    }),

  PipelineNotFoundError: (pipelineId: string) =>
    new GentraceWarning({
      warningId: 'GT_PipelineNotFoundError',
      title: 'Gentrace Pipeline Not Found',
      message: [
        `Pipeline '${pipelineId}' does not exist or is not accessible.`,
        '',
        `Please verify the pipeline ID matches what's shown in the Gentrace UI.`,
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-pipelinenotfounderror',
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
      borderColor: 'red',
    }),

  PipelineUnauthorizedError: (pipelineId: string) =>
    new GentraceWarning({
      warningId: 'GT_PipelineUnauthorizedError',
      title: 'Gentrace Pipeline Unauthorized',
      message: [
        `Access denied to pipeline '${pipelineId}'.`,
        '',
        `Please check your GENTRACE_API_KEY has the correct permissions.`,
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-pipelineunauthorizederror',
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
      borderColor: 'red',
    }),

  PipelineError: (pipelineId: string, errorMessage?: string) =>
    new GentraceWarning({
      warningId: 'GT_PipelineError',
      title: 'Gentrace Pipeline Error',
      message: [
        `Failed to validate pipeline '${pipelineId}'.`,
        '',
        `Error: ${errorMessage || 'Unknown error'}`,
      ],
      learnMoreUrl: null,
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
      borderColor: 'red',
    }),

  OtelNotConfiguredError: () =>
    new GentraceWarning({
      warningId: 'GT_OtelNotConfiguredError',
      title: 'Gentrace Configuration Warning',
      message: [
        'OpenTelemetry SDK does not appear to be configured. This means that Gentrace features',
        'like interaction(), evalOnce(), traced(), and evalDataset() will not record any data to the',
        'Gentrace UI.',
        '',
        'You likely disabled automatic OpenTelemetry setup by passing otelSetup: false to init().',
        'If so, you can fix this by either:',
        '',
        '1. Remove the otelSetup: false option from init() to enable automatic setup',
        '2. Or manually configure OpenTelemetry yourself (see documentation)',
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-otelnotconfigurederror',
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
    }),

  AutoInitializationWarning: () =>
    new GentraceWarning({
      warningId: 'GT_AutoInitializationWarning',
      title: 'Auto-Initialization',
      message: [
        'Gentrace was automatically initialized from environment variables.',
        '',
        'This likely means your init() call is not being executed, which can cause issues:',
        "• Custom options passed to init() won't be applied (instrumentations, debug, etc.)",
        '• Instrumentations may not work correctly',
        '• OpenTelemetry configuration may be incomplete',
        '',
        'To fix this, ensure init() is called before executing any Gentrace functions.',
        '',
        'Note: Each **distinct** process/service must call init() before using Gentrace functions.',
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-autoinitializationwarning',
      suppressionHint:
        'To suppress this warning: interaction(name, fn, { pipelineId, suppressWarnings: true })',
    }),

  OtelGlobalError: (error: any) =>
    new GentraceWarning({
      warningId: 'GT_OtelGlobalError',
      title: 'OpenTelemetry Global Error',
      message: [
        'An error occurred in the OpenTelemetry instrumentation.',
        '',
        `Error: ${typeof error === 'string' ? error : error?.message || String(error)}`,
        '',
        'This may affect trace collection and instrumentation functionality.',
        'Common causes include:',
        '• Network connectivity issues with the trace endpoint',
        '• Invalid configuration or credentials',
        '• Resource limits or memory constraints',
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-otelglobalerror',
      suppressionHint: 'To suppress OpenTelemetry errors: Use a custom error handler in setup()',
      borderColor: 'red',
    }),

  MissingApiKeyError: () =>
    new GentraceWarning({
      warningId: 'GT_MissingApiKeyError',
      title: 'Gentrace API Key Missing',
      message: [
        'Gentrace API key is missing or invalid. The SDK cannot connect to Gentrace',
        'without a valid API key.',
        '',
        'To fix this, provide your API key in one of these ways:',
        '',
        '1. Set the GENTRACE_API_KEY environment variable:',
        '   export GENTRACE_API_KEY="your-api-key"',
        '',
        '2. Pass it directly to init():',
        '   init({ apiKey: "your-api-key" })',
        '',
        'Get your API key from: https://gentrace.ai/settings',
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-missingapikeyerror',
      borderColor: 'red',
    }),

  MultipleInitWarning: (params: {
    callNumber: number;
    diffLines: string[];
    initHistory: Array<{ timestamp: Date; callNumber: number }>;
  }) =>
    new GentraceWarning({
      warningId: 'GT_MultipleInitWarning',
      title: 'Multiple Initialization Detected',
      message: [
        `Gentrace init() has been called ${params.callNumber} times. The new configuration is`,
        'overriding the previous one.',
        '',
        'Configuration changes:',
        '',
        ...params.diffLines,
        '',
        'This may cause unexpected behavior if different parts of your',
        'application expect different configurations.',
        '',
        'Previous init() calls:',
        ...params.initHistory.map((call) => `  - Call #${call.callNumber}: ${call.timestamp.toISOString()}`),
      ],
      learnMoreUrl: 'https://next.gentrace.ai/docs/sdk-reference/errors#gt-multipleinitwarning',
      suppressionHint: 'To suppress this warning: init({ ..., suppressWarnings: true })',
    }),
};
