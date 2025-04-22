import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import OpenAI from 'openai';
import { stringify } from 'superjson';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { test } from '../src/lib/test-single';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-example',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
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

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

const PIPELINE_ID = '26d64c23-e38c-56fd-9b45-9adc87de797b';

// Make sure to set the OPENAI_API_KEY environment variable
const openai = new OpenAI();

// Define the interaction: Wrap the OpenAI call
const compose = interaction(
  PIPELINE_ID, // Name for the interaction
  async ({ recipient, topic, sender }: { recipient: string; topic: string; sender: string }) => {
    const tracer = trace.getTracer('openai-email-composition-example');
    const initialArgs = { recipient, topic, sender }; // Capture initial args

    return await tracer.startActiveSpan('composeEmailProcess', async (processSpan) => {
      let finalResult: string | null = null; // To capture final result for output event
      try {
        console.log(`Composing email to ${recipient} about ${topic} from ${sender}...`);
        // Add input event for the main process span
        processSpan.addEvent('gentrace.fn.args', { args: stringify(initialArgs) });

        processSpan.setAttributes({
          'email.recipient': recipient,
          'email.topic': topic,
          'email.sender': sender,
        });

        // 1. Simulate fetching recipient details (e.g., from a database)
        let recipientDetails = {};
        await tracer.startActiveSpan('fetchRecipientPreferences', async (dbSpan) => {
          try {
            // Add input event
            dbSpan.addEvent('gentrace.fn.args', { args: stringify({ recipient }) });

            dbSpan.setAttributes({
              'db.system': 'fakedb',
              'db.operation': 'select',
              'db.statement': `SELECT preferences FROM users WHERE email = '${recipient}'`,
            });
            // Simulate DB call delay
            await new Promise((resolve) => setTimeout(resolve, 50));
            recipientDetails = { preferredTone: 'formal' };
            dbSpan.setStatus({ code: SpanStatusCode.OK });
            // Add output event
            dbSpan.addEvent('gentrace.fn.output', { output: stringify(recipientDetails) });
            console.log('Fetched recipient preferences (simulated).');
          } catch (dbError: any) {
            dbSpan.recordException(dbError);
            dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: dbError.message });
            throw dbError;
          } finally {
            dbSpan.end();
          }
        });

        // 2. Construct the prompt
        let messages: any[];
        await tracer.startActiveSpan('constructPrompt', (promptSpan) => {
          const promptArgs = { recipientDetails, recipient, topic, sender };
          // Add input event
          promptSpan.addEvent('gentrace.fn.args', { args: stringify(promptArgs) });

          messages = [
            {
              role: 'system',
              content: `You are a helpful assistant that drafts concise and professional emails. Adapt to a ${
                (recipientDetails as any).preferredTone || 'neutral'
              } tone.`,
            },
            {
              role: 'user',
              content: `Compose an email to ${recipient} regarding the topic: ${topic} from ${sender}`,
            },
          ];
          promptSpan.setAttribute('prompt.system', messages[0].content);
          promptSpan.setAttribute('prompt.user', messages[1].content);
          promptSpan.setStatus({ code: SpanStatusCode.OK });
          // Add output event
          promptSpan.addEvent('gentrace.fn.output', { output: stringify(messages) });
          promptSpan.end();
          console.log('Prompt constructed.');
        });

        // 3. Call OpenAI API (this will also be traced by auto-instrumentation, but we add a custom span for context)
        let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
        await tracer.startActiveSpan('callOpenAI', { kind: SpanKind.CLIENT }, async (apiSpan) => {
          try {
            const apiArgs = { messages, model: 'gpt-4o', temperature: 0.7, max_tokens: 200 };
            // Add input event
            apiSpan.addEvent('gentrace.fn.args', { args: stringify(apiArgs) });

            apiSpan.setAttributes({
              'openai.model': 'gpt-4o',
              'openai.temperature': 0.7,
              'openai.max_tokens': 200,
            });
            completion = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: messages,
              max_tokens: 200,
              temperature: 0.7,
            });
            apiSpan.setStatus({ code: SpanStatusCode.OK });
            // Add output event
            apiSpan.addEvent('gentrace.fn.output', { output: stringify(completion) });
            console.log('OpenAI API call successful.');
          } catch (apiError: any) {
            apiSpan.recordException(apiError);
            apiSpan.setStatus({ code: SpanStatusCode.ERROR, message: apiError.message });
            throw apiError;
          } finally {
            apiSpan.end();
          }
        });

        // 4. Parse the response
        let emailContent: string | null = null;
        await tracer.startActiveSpan('parseOpenAIResponse', (parseSpan) => {
          try {
            // Add input event
            parseSpan.addEvent('gentrace.fn.args', { args: stringify(completion) });

            const message = completion?.choices[0]?.message;
            if (!message || !message.content) {
              console.warn('OpenAI response did not contain message content.');
              parseSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: 'Missing message content in OpenAI response',
              });
              parseSpan.setAttribute('parsing.error', 'MissingContent');
            } else {
              emailContent = message.content;
              parseSpan.setAttribute('parsing.output_length', emailContent.length);
              parseSpan.setStatus({ code: SpanStatusCode.OK });
              // Add output event
              parseSpan.addEvent('gentrace.fn.output', { output: stringify(emailContent) });
              console.log('Email draft parsed successfully.');
            }
          } catch (parseError: any) {
            parseSpan.recordException(parseError);
            parseSpan.setStatus({ code: SpanStatusCode.ERROR, message: parseError.message });
            throw parseError;
          } finally {
            parseSpan.end();
          }
        });

        // 5. Simulate saving the draft
        await tracer.startActiveSpan('saveEmailDraft', async (saveSpan) => {
          try {
            // Add input event
            saveSpan.addEvent('gentrace.fn.args', { args: stringify({ emailContent }) });

            saveSpan.setAttributes({
              'db.system': 'fakedb',
              'db.operation': 'insert',
              'db.collection': 'email_drafts',
            });
            // Simulate DB call delay
            await new Promise((resolve) => setTimeout(resolve, 30));
            saveSpan.setStatus({ code: SpanStatusCode.OK });
            console.log('Email draft saved (simulated).');
          } catch (dbError: any) {
            saveSpan.recordException(dbError);
            saveSpan.setStatus({ code: SpanStatusCode.ERROR, message: dbError.message });
            console.error('Failed to save draft (simulated):', dbError);
          } finally {
            saveSpan.end();
          }
        });

        processSpan.setStatus({ code: SpanStatusCode.OK });
        finalResult = emailContent; // Store final result before returning
        return finalResult;
      } catch (error: any) {
        console.error('Error composing email:', error);
        processSpan.recordException(error);
        processSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        finalResult = null; // Ensure finalResult is null on error
        return finalResult;
      } finally {
        // Add output event for the main process span
        processSpan.addEvent('gentrace.fn.output', { output: stringify(finalResult) });
        processSpan.end();
      }
    });
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
