import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// Build the resource using resourceFromAttributes
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-example',
});

console.log('api key', process.env['GENTRACE_API_KEY']);

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: resource, // Pass the created resource object
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:3000/api/otel/v1/traces',
    // Optional: Add Gentrace API key if required by the endpoint
    headers: {
      Authorization: `Bearer ${process.env['GENTRACE_API_KEY']}`,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

console.log('OpenTelemetry SDK started.');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down OpenTelemetry SDK...');
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { test } from '../src/lib/test-single';

dotenv.config();

init({
  baseURL: 'http://localhost:3000/api',
});

const PIPELINE_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';

// Make sure to set the OPENAI_API_KEY environment variable
const openai = new OpenAI();

// Define the interaction: Wrap the OpenAI call
const compose = interaction(
  PIPELINE_ID, // Name for the interaction
  async ({ recipient, topic, sender }: { recipient: string; topic: string; sender: string }) => {
    console.log(`Composing email to ${recipient} about ${topic} from ${sender}...`);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that drafts concise and professional emails.',
          },
          {
            role: 'user',
            content: `Compose an email to ${recipient} regarding the topic: ${topic} from ${sender}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const message = completion.choices[0]?.message;
      if (!message || !message.content) {
        console.warn('OpenAI response did not contain message content.');
        return null;
      }

      const emailContent = message.content;
      console.log('Email draft composed successfully.');
      return emailContent;
    } catch (error) {
      console.error('Error composing email:', error);
      return null;
    }
  },
);

// Example usage within an experiment:
async function runExperiment() {
  try {
    await experiment(PIPELINE_ID, async () => {
      console.log(`Running experiment for pipeline: ${PIPELINE_ID}`);

      // Define test cases
      try {
        await test('Test Case 1: Project Phoenix Update', async () => {
          const recipient = 'Alice';
          const topic = 'Project Phoenix Update';
          const sender = 'John Doe';
          const draft = await compose({ recipient, topic, sender });

          if (draft) {
            console.log('\n--- Test Case 1 Draft ---\n');
            console.log(draft);
            console.log('\n-------------------------\n');
          }
          // In a real scenario, you might add assertions here
          // e.g., expect(draft).toContain('Project Phoenix');
        });
      } catch (error) {
        console.error('Error in Test Case 1:', error);
      }

      try {
        await test('Test Case 2: Quarterly Review', async () => {
          const recipient = 'Bob';
          const topic = 'Quarterly Review Preparation';
          const sender = 'John Doe';
          const draft = await compose({ recipient, topic, sender });

          if (draft) {
            console.log('\n--- Test Case 2 Draft ---\n');
            console.log(draft);
            console.log('\n-------------------------\n');
          }
          // Assertions would go here too
        });
      } catch (error) {
        console.error('Error in Test Case 2:', error);
      }

      // Add more test cases as needed
    });
  } catch (error) {
    console.error(JSON.stringify(error, null, 2), 'Error running experiment:');
  }

  console.log('Experiment run finished.');
}

async function main() {
  try {
    await runExperiment();
  } catch (error) {
    console.error('Unhandled error during script execution:', error);
    process.exitCode = 1; // Indicate failure
  } finally {
    console.log('Shutting down OpenTelemetry SDK...');
    try {
      await sdk.shutdown();
      console.log('OpenTelemetry SDK shut down successfully.');
    } catch (shutdownError) {
      console.error('Error shutting down OpenTelemetry SDK:', shutdownError);
      process.exitCode = process.exitCode ?? 1; // Ensure exit code reflects shutdown error too
    }
  }
}

main();

// Existing SIGTERM handler remains as a fallback
process.on('SIGTERM', () => {
  // Optional: you might want to prevent double shutdown if main() is already handling it
  console.log('SIGTERM received, ensuring shutdown...');
  // The finally block in main() should ideally handle this,
  // but this remains as a safeguard.
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated via SIGTERM.'))
    .catch((error) => console.log('Error terminating tracing via SIGTERM', error))
    .finally(() => process.exit(0));
});
