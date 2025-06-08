/**
 * Test to verify the formatted warning display works properly
 */

const boxen = require('boxen');
const chalk = require('chalk');
const { highlight } = require('cli-highlight');

console.log('Testing formatted warning display...\n');

const warningTitle = chalk.yellow.bold('⚠ Gentrace Configuration Warning');

const warningMessage = `
OpenTelemetry SDK does not appear to be configured. This means that Gentrace features
like @interaction, @eval, @traced, and evalDataset() will not record any data to the
Gentrace UI.

To fix this, please follow the setup guide:
${chalk.blue.underline('https://docs.gentrace.ai/docs/nodejs')}

Or add this code to the beginning of your application:
`;

const starterCode = `import { Gentrace } from 'gentrace';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Initialize Gentrace SDK
const gentrace = new Gentrace({
  apiKey: process.env.GENTRACE_API_KEY
});

// Configure OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'your-service-name',
  }),
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://api.gentrace.ai/v1/otel/traces',
        headers: {
          Authorization: \`Bearer \${process.env.GENTRACE_API_KEY}\`,
        },
      })
    ),
  ],
});

// Start the SDK
sdk.start();`;

try {
  const highlightedCode = highlight(starterCode, { language: 'javascript' });

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

  console.log('✅ Formatted warning display successful!');
} catch (error) {
  console.error('Error testing formatted warning:', error.message);
}
