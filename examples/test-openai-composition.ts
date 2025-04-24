import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { test } from '../src/lib/test-single';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified-test',
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

process.on('SIGTERM', () => {
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

const PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;

const compose = interaction(
  PIPELINE_ID,
  async ({ recipient, topic, sender }: { recipient: string; topic: string; sender: string }) => {
    const tracer = trace.getTracer('openai-email-composition-simplified-test');

    return await tracer.startActiveSpan('composeEmailProcess', async (processSpan) => {
      let finalResult: string | null = 'Simplified email draft';
      try {
        processSpan.setAttributes({
          'email.recipient': recipient,
          'email.topic': topic,
          'email.sender': sender,
        });

        let recipientDetails = {};
        await tracer.startActiveSpan('fetchRecipientPreferences', async (dbSpan) => {
          dbSpan.setAttributes({
            'db.system': 'fakedb',
            'db.operation': 'select',
          });
          recipientDetails = { preferredTone: 'formal' };
          dbSpan.end();
        });

        let messages: any[];
        await tracer.startActiveSpan('constructPrompt', (promptSpan) => {
          messages = [
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: 'User prompt' },
          ];
          promptSpan.setAttribute('prompt.system', messages[0].content);
          promptSpan.setAttribute('prompt.user', messages[1].content);
          promptSpan.end();
        });

        let completion: any | null = null;
        await tracer.startActiveSpan('callOpenAI', { kind: SpanKind.CLIENT }, async (apiSpan) => {
          const apiArgs = { messages, model: 'gpt-4o-mini', temperature: 0.1, max_tokens: 50 };
          apiSpan.setAttributes({
            'openai.model': 'gpt-4o-mini',
            'openai.temperature': 0.1,
            'openai.max_tokens': 50,
          });
          completion = { choices: [{ message: { content: finalResult } }] };
          apiSpan.end();
        });

        let emailContent: string | null = null;
        await tracer.startActiveSpan('parseOpenAIResponse', (parseSpan) => {
          emailContent = completion?.choices[0]?.message?.content ?? null;
          if (emailContent) {
            parseSpan.setAttribute('parsing.output_length', emailContent.length);
          } else {
            parseSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Parsing failed' });
          }
          parseSpan.end();
        });

        await tracer.startActiveSpan('saveEmailDraft', async (saveSpan) => {
          saveSpan.setAttributes({
            'db.system': 'fakedb',
            'db.operation': 'insert',
            'db.collection': 'email_drafts',
          });
          saveSpan.end();
        });

        return finalResult;
      } catch (error: any) {
        processSpan.recordException(error);
        processSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        finalResult = null;
        return finalResult;
      } finally {
        processSpan.end();
      }
    });
  },
);

async function runExperiment() {
  try {
    await experiment(PIPELINE_ID, async () => {
      await test('Simplified Test Case', async () => {
        return await compose({ recipient: 'TestRecipient', topic: 'TestTopic', sender: 'TestSender' });
      });
    });
  } catch (error) {
    console.error('Error running experiment:', error);
  }
}

async function main() {
  try {
    await runExperiment();
  } catch (error) {
    console.error('Unhandled error during script execution:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sdk.shutdown();
    } catch (shutdownError) {
      console.error('Error shutting down OpenTelemetry SDK:', shutdownError);
      process.exitCode = process.exitCode ?? 1;
    }
  }
}

main();
