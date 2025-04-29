import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { readEnv } from 'gentrace/internal/utils';
import OpenAI from 'openai';
import { traced } from '../../src/lib/traced';

const openai = new OpenAI({
  apiKey: readEnv('OPENAI_API_KEY'),
});

async function _composeEmailLogic(recipient: string, topic: string, sender: string): Promise<string | null> {
  const tracer = trace.getTracer('openai-email-composition-simplified');
  return await tracer.startActiveSpan('composeEmailProcess', async (processSpan): Promise<string | null> => {
    let finalResult: string | null = null;
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
        // Simulate fetching details
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
            'gen_ai.response.finish_reasons': JSON.stringify(completion.choices.map((c) => c.finish_reason)),
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
}

export const composeEmail = traced(_composeEmailLogic, { name: 'composeEmail' });
