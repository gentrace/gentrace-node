import { init, interaction, GentraceSampler } from '../src';
import OpenAI from 'openai';

async function main() {
  // Initialize Gentrace with custom OpenTelemetry configuration
  init({
    apiKey: process.env['GENTRACE_API_KEY'] || '',
    baseURL: process.env['GENTRACE_BASE_URL'] || 'https://gentrace.ai/api',
    serviceName: 'openai-advanced-example',
    resourceAttributes: {
      environment: process.env['NODE_ENV'] || 'development',
      version: '1.0.0',
      team: 'ai-engineering',
    },
    sampler: new GentraceSampler(),
  });

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });

  // Example: Function calling with error handling
  const getWeather = interaction(
    'get-weather-with-function',
    async (location: string) => {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `What's the weather like in ${location}?`,
            },
          ],
          functions: [
            {
              name: 'get_current_weather',
              description: 'Get the current weather in a given location',
              parameters: {
                type: 'object',
                properties: {
                  location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                  },
                  unit: {
                    type: 'string',
                    enum: ['celsius', 'fahrenheit'],
                  },
                },
                required: ['location'],
              },
            },
          ],
          function_call: 'auto',
        });

        const message = response.choices[0]?.message;

        // Check if the model wants to call a function
        if (message?.function_call) {
          const functionName = message.function_call.name;
          const functionArgs = JSON.parse(message.function_call.arguments);

          // Simulate function execution
          let functionResponse;
          if (functionName === 'get_current_weather') {
            // Mock weather data
            functionResponse = JSON.stringify({
              temperature: 72,
              unit: functionArgs.unit || 'fahrenheit',
              description: 'Sunny',
              location: functionArgs.location,
            });
          }

          // Send the function response back to the model
          const secondResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: `What's the weather like in ${location}?`,
              },
              message,
              {
                role: 'function',
                name: functionName,
                content: functionResponse!,
              },
            ],
          });

          return secondResponse.choices[0]?.message?.content || '';
        }

        return message?.content || '';
      } catch (error) {
        console.error('Error in weather function:', error);
        throw error;
      }
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'weather-pipeline',
    },
  );

  // Example: Retry logic with exponential backoff
  const robustCompletion = interaction(
    'robust-completion',
    async (prompt: string, maxRetries = 3) => {
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
          });

          return response.choices[0]?.message?.content || '';
        } catch (error: any) {
          lastError = error;
          console.log(`Attempt ${attempt + 1} failed:`, error.message);

          if (attempt < maxRetries - 1) {
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
    },
    {
      pipelineId: process.env['GENTRACE_PIPELINE_ID'] || 'robust-pipeline',
    },
  );

  // Run examples
  console.log('=== Weather Function Calling ===');
  try {
    const weather = await getWeather('San Francisco, CA');
    console.log('Weather:', weather);
  } catch (error) {
    console.error('Weather error:', error);
  }

  console.log('\n=== Robust Completion with Retry ===');
  try {
    const response = await robustCompletion('Explain quantum computing in one sentence.');
    console.log('Response:', response);
  } catch (error) {
    console.error('Robust completion error:', error);
  }

  // Wait for spans to flush
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('\nDone!');
}

main().catch(console.error);
