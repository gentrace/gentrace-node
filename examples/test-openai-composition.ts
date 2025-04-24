import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { readEnv } from 'gentrace/internal/utils';
import { experiment } from '../src/lib/experiment';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { test } from '../src/lib/test-single';

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID')!;
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY')!;
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY')!;

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY || !OPENAI_API_KEY) {
  throw new Error('GENTRACE_PIPELINE_ID, GENTRACE_API_KEY, and OPENAI_API_KEY must be set');
}

dotenv.config();

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified-test',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      Authorization: `Bearer ${GENTRACE_API_KEY}`,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('beforeExit', async () => {
  await sdk.shutdown();
});

process.on('SIGTERM', async () => {
  await sdk.shutdown();
});
// End OpenTelemetry SDK setup

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const compose = interaction(
  GENTRACE_PIPELINE_ID,
  async ({ recipient, topic, sender }: { recipient: string; topic: string; sender: string }) => {
    const tracer = trace.getTracer('openai-email-composition-simplified-test');

    return await tracer.startActiveSpan('composeEmailProcess', async (processSpan) => {
      let finalResult: string | null = null;
      try {
        processSpan.setAttributes({
          'email.recipient': recipient,
          'email.topic': topic,
          'email.sender': sender,
        });

        await tracer.startActiveSpan('fetchRecipientPreferences', async (dbSpan) => {
          dbSpan.setAttributes({
            'db.system': 'fakedb',
            'db.operation': 'select',
          });
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

          messages.forEach((msg, index) => {
            promptSpan.addEvent(`gen_ai.${msg.role}.message`, {
              'gen_ai.message.index': index,
              'gen_ai.message.role': msg.role,
              'gen_ai.message.content': msg.content,
            });
          });

          promptSpan.end();
        });

        let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
        await tracer.startActiveSpan('callOpenAI', { kind: SpanKind.CLIENT }, async (apiSpan) => {
          const model = 'gpt-4o-mini';
          const temperature = 0.1;
          const max_tokens = 100;

          apiSpan.setAttributes({
            'gen_ai.system': 'openai',
            'gen_ai.request.model': model,
            'gen_ai.request.temperature': temperature,
            'gen_ai.request.max_tokens': max_tokens,
            'server.address': 'api.openai.com',
            'server.port': 443,
          });

          try {
            completion = await openai.chat.completions.create({
              model: model,
              messages: messages,
              temperature: temperature,
              max_tokens: max_tokens,
            });

            apiSpan.setAttributes({
              'gen_ai.response.id': completion.id,
              'gen_ai.response.model': completion.model,
              'gen_ai.response.finish_reasons': JSON.stringify(
                completion.choices.map((c) => c.finish_reason),
              ),
              'gen_ai.usage.input_tokens': completion.usage?.prompt_tokens,
              'gen_ai.usage.output_tokens': completion.usage?.completion_tokens,
            });

            completion.choices.forEach((choice, index) => {
              apiSpan.addEvent('gen_ai.choice', {
                'gen_ai.choice.index': index,
                'gen_ai.choice.finish_reason': choice.finish_reason,
                'gen_ai.choice.message.role': choice.message.role,
                'gen_ai.choice.message.content': choice.message.content ?? '',
              });
            });

            apiSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error: any) {
            apiSpan.recordException(error);
            apiSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            apiSpan.setAttribute('error.type', error.name);
            throw error;
          } finally {
            apiSpan.end();
          }
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

        finalResult = emailContent;
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

experiment(GENTRACE_PIPELINE_ID, async () => {
  await test('Simplified Test Case', async () => {
    return await compose({ recipient: 'TestRecipient', topic: 'TestTopic', sender: 'TestSender' });
  });
});
