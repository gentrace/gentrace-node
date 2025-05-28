import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import Anthropic from '@anthropic-ai/sdk';
import { readEnv } from '../../src/internal/utils';
import { traced } from '../../src/lib/traced';

const anthropic = new Anthropic({
  apiKey: readEnv('ANTHROPIC_API_KEY'),
});

async function _composeEmailLogic(recipient: string, topic: string, sender: string): Promise<string | null> {
  const tracer = trace.getTracer('anthropic-email-composition-simplified');
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
        const systemPrompt =
          'You are a professional email assistant. Write clear, concise, and professional emails.';
        const userPrompt = `Write a professional email to ${recipient} about ${topic}. The email should be signed by ${sender}.`;

        messages = [{ role: 'user', content: userPrompt }];

        promptSpan.setAttribute('prompt.system', systemPrompt);
        promptSpan.setAttribute('prompt.user', userPrompt);

        messages.forEach((msg, index) => {
          promptSpan.addEvent(`gen_ai.${msg.role}.message`, {
            'gen_ai.message.index': index,
            'gen_ai.message.role': msg.role,
            'gen_ai.message.content': msg.content,
          });
        });

        promptSpan.end();
      });

      let completion: Anthropic.Messages.Message | null = null;
      await tracer.startActiveSpan('callAnthropic', { kind: SpanKind.CLIENT }, async (apiSpan) => {
        const model = 'claude-3-5-haiku-20241022';
        const max_tokens = 1000;

        apiSpan.setAttributes({
          'gen_ai.system': 'anthropic',
          'gen_ai.request.model': model,
          'gen_ai.request.max_tokens': max_tokens,
          'server.address': 'api.anthropic.com',
          'server.port': 443,
        });

        // Add system prompt as event
        apiSpan.addEvent('gen_ai.system.message', {
          'gen_ai.message.role': 'system',
          'gen_ai.message.content':
            'You are a professional email assistant. Write clear, concise, and professional emails.',
        });

        // Add user messages as events
        messages.forEach((msg, index) => {
          apiSpan.addEvent(`gen_ai.${msg.role}.message`, {
            'gen_ai.message.index': index,
            'gen_ai.message.role': msg.role,
            'gen_ai.message.content': msg.content,
          });
        });

        try {
          completion = await anthropic.messages.create({
            model: model,
            max_tokens: max_tokens,
            system: 'You are a professional email assistant. Write clear, concise, and professional emails.',
            messages: messages,
          });

          apiSpan.setAttributes({
            'gen_ai.response.id': completion.id,
            'gen_ai.response.model': completion.model,
            'gen_ai.response.finish_reason': completion.stop_reason || undefined,
            'gen_ai.usage.input_tokens': completion.usage.input_tokens,
            'gen_ai.usage.output_tokens': completion.usage.output_tokens,
          });

          // Add response content as attribute
          const textContent = completion.content.find((c) => c.type === 'text');
          if (textContent?.type === 'text') {
            apiSpan.setAttribute('gen_ai.response.content', textContent.text);
          }

          completion.content.forEach((content, index) => {
            if (content.type === 'text') {
              apiSpan.addEvent('gen_ai.content', {
                'gen_ai.content.index': index,
                'gen_ai.content.type': content.type,
                'gen_ai.content.text': content.text,
              });
            }
          });

          completion.content.forEach((content, index) => {
            apiSpan.addEvent('gen_ai.choice', {
              'gen_ai.choice.index': index,
              'gen_ai.choice.message.role': 'assistant',
              'gen_ai.choice.message.content': content.type === 'text' ? content.text : '',
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
      await tracer.startActiveSpan('parseAnthropicResponse', (parseSpan) => {
        const textContent = completion?.content.find((c) => c.type === 'text');
        emailContent = textContent?.type === 'text' ? textContent.text : null;

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
      if (finalResult) {
        processSpan.setAttribute('email.content', finalResult);
      }
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

export const composeEmail = traced('composeEmail', _composeEmailLogic);
