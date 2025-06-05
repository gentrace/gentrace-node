import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SpanKind, SpanStatusCode, trace, context, propagation } from '@opentelemetry/api';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { readEnv } from '../src/internal/utils';
import { GentraceSampler, GentraceSpanProcessor } from '../src/lib';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';

dotenv.config();

const GENTRACE_BASE_URL = readEnv('GENTRACE_BASE_URL');
const GENTRACE_PIPELINE_ID = readEnv('GENTRACE_PIPELINE_ID');
const GENTRACE_API_KEY = readEnv('GENTRACE_API_KEY');
const OPENAI_API_KEY = readEnv('OPENAI_API_KEY');

if (!GENTRACE_PIPELINE_ID || !GENTRACE_API_KEY || !OPENAI_API_KEY) {
  console.error('Required environment variables must be set');
  console.log('\nTo run this example, please set the following environment variables:');
  console.log('  GENTRACE_API_KEY=your_gentrace_api_key');
  console.log('  GENTRACE_PIPELINE_ID=your_pipeline_id');
  console.log('  OPENAI_API_KEY=your_openai_api_key');
  console.log('\nYou can create a .env file in the root directory with these values.');
  process.exit(1);
}

init({
  baseURL: GENTRACE_BASE_URL,
});

// Begin OpenTelemetry SDK setup with advanced configuration
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'mastra-advanced-example',
    [ATTR_SERVICE_VERSION]: '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
    'service.namespace': 'mastra-examples',
  }),
  sampler: new GentraceSampler({
    ratio: 1.0, // Sample all traces for this example
  }),
  instrumentations: [],
  spanProcessors: [
    new GentraceSpanProcessor(),
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
        },
      }),
    ),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
  contextManager: new AsyncLocalStorageContextManager().enable(),
});

sdk.start();

process.on('beforeExit', async () => {
  await sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await sdk
    .shutdown()
    .then(() => console.log('Tracing terminated.'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
// End OpenTelemetry SDK setup

// Create a tracer for this module
const tracer = trace.getTracer('mastra-advanced-example', '1.0.0');

// Advanced tool with detailed telemetry
const searchProductsTool = createTool({
  id: 'search-products',
  description: 'Search for products in our catalog with filters',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    category: z.string().optional().describe('Product category filter'),
    minPrice: z.number().optional().describe('Minimum price filter'),
    maxPrice: z.number().optional().describe('Maximum price filter'),
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
        description: z.string(),
        inStock: z.boolean(),
      }),
    ),
    totalCount: z.number(),
  }),
  execute: async ({ context }) => {
    return await tracer.startActiveSpan(
      'search-products-tool',
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'tool.name': 'search-products',
          'search.query': context.query,
          'search.category': context.category || 'all',
          'search.price_range': context.minPrice && context.maxPrice ? `${context.minPrice}-${context.maxPrice}` : 'any',
        },
      },
      async (span) => {
        try {
          // Simulate database query with telemetry
          const dbSpan = tracer.startSpan('database.query', {
            kind: SpanKind.CLIENT,
            attributes: {
              'db.system': 'postgresql',
              'db.operation': 'SELECT',
              'db.statement': `SELECT * FROM products WHERE name ILIKE '%${context.query}%'`,
            },
          });

          // Mock product data
          const mockProducts = [
            {
              id: '1',
              name: 'Wireless Headphones',
              price: 99.99,
              category: 'Electronics',
              description: 'High-quality wireless headphones with noise cancellation',
              inStock: true,
            },
            {
              id: '2',
              name: 'Smart Watch',
              price: 299.99,
              category: 'Electronics',
              description: 'Advanced fitness tracking and notifications',
              inStock: true,
            },
            {
              id: '3',
              name: 'Yoga Mat',
              price: 29.99,
              category: 'Sports',
              description: 'Premium non-slip yoga mat',
              inStock: false,
            },
          ];

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 100));

          dbSpan.setStatus({ code: SpanStatusCode.OK });
          dbSpan.end();

          // Filter products based on criteria
          let filtered = mockProducts.filter((p) =>
            p.name.toLowerCase().includes(context.query.toLowerCase()),
          );

          if (context.category) {
            filtered = filtered.filter((p) => p.category === context.category);
          }

          if (context.minPrice) {
            filtered = filtered.filter((p) => p.price >= context.minPrice);
          }

          if (context.maxPrice) {
            filtered = filtered.filter((p) => p.price <= context.maxPrice);
          }

          span.setAttributes({
            'search.results_count': filtered.length,
            'search.total_products': mockProducts.length,
          });

          span.addEvent('search_completed', {
            results_count: filtered.length,
            execution_time_ms: 100,
          });

          span.setStatus({ code: SpanStatusCode.OK });

          return {
            products: filtered,
            totalCount: filtered.length,
          };
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  },
});

// Tool for order processing
const processOrderTool = createTool({
  id: 'process-order',
  description: 'Process a customer order',
  inputSchema: z.object({
    customerId: z.string(),
    productIds: z.array(z.string()),
    totalAmount: z.number(),
  }),
  outputSchema: z.object({
    orderId: z.string(),
    status: z.string(),
    estimatedDelivery: z.string(),
  }),
  execute: async ({ context }) => {
    return await tracer.startActiveSpan(
      'process-order-tool',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'order.customer_id': context.customerId,
          'order.product_count': context.productIds.length,
          'order.total_amount': context.totalAmount,
        },
      },
      async (span) => {
        try {
          // Simulate order validation
          const validationSpan = tracer.startSpan('order.validate', {
            kind: SpanKind.INTERNAL,
          });
          await new Promise((resolve) => setTimeout(resolve, 50));
          validationSpan.setStatus({ code: SpanStatusCode.OK });
          validationSpan.end();

          // Simulate payment processing
          const paymentSpan = tracer.startSpan('payment.process', {
            kind: SpanKind.CLIENT,
            attributes: {
              'payment.amount': context.totalAmount,
              'payment.currency': 'USD',
              'payment.method': 'credit_card',
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 150));
          paymentSpan.addEvent('payment_authorized', {
            transaction_id: 'txn_' + Math.random().toString(36).substr(2, 9),
          });
          paymentSpan.setStatus({ code: SpanStatusCode.OK });
          paymentSpan.end();

          const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          const deliveryDays = 3 + Math.floor(Math.random() * 4);
          const estimatedDelivery = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          span.setAttributes({
            'order.id': orderId,
            'order.status': 'confirmed',
            'order.estimated_delivery': estimatedDelivery,
          });

          span.addEvent('order_confirmed', {
            order_id: orderId,
            processing_time_ms: 200,
          });

          span.setStatus({ code: SpanStatusCode.OK });

          return {
            orderId,
            status: 'confirmed',
            estimatedDelivery,
          };
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  },
});

// Create agents with memory and advanced configuration
const shoppingAssistant = new Agent({
  name: 'Shopping Assistant',
  instructions: `You are a helpful shopping assistant for an e-commerce platform. You help customers:
1. Search for products based on their needs
2. Provide product recommendations
3. Process orders when customers are ready to purchase
4. Remember customer preferences and past interactions

Always be helpful, provide detailed product information, and guide customers through their shopping journey.`,
  model: openai('gpt-4o-mini'),
  tools: {
    searchProductsTool,
    processOrderTool,
  },
  memory: new Memory({
    sessionId: 'shopping-session-' + Date.now(),
    options: {
      lastMessages: 20,
    },
  }),
});

// Create a recommendation workflow with multiple steps
const recommendationWorkflow = createWorkflow({
  id: 'recommendationWorkflow',
  inputSchema: z.object({
    customerId: z.string(),
    preferences: z.object({
      categories: z.array(z.string()),
      priceRange: z.object({
        min: z.number(),
        max: z.number(),
      }),
    }),
  }),
  outputSchema: z.object({
    recommendations: z.array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        reason: z.string(),
        score: z.number(),
      }),
    ),
  }),
})
  .then(
    createStep({
      id: 'fetch-customer-history',
      description: 'Fetch customer purchase history',
      inputSchema: z.object({
        customerId: z.string(),
        preferences: z.any(),
      }),
      outputSchema: z.object({
        customerId: z.string(),
        preferences: z.any(),
        purchaseHistory: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            category: z.string(),
            price: z.number(),
          }),
        ),
      }),
      execute: async ({ inputData }) => {
        return await tracer.startActiveSpan(
          'fetch-customer-history',
          {
            kind: SpanKind.CLIENT,
            attributes: {
              'customer.id': inputData.customerId,
            },
          },
          async (span) => {
            try {
              // Mock customer history
              const mockHistory = [
                {
                  productId: '1',
                  productName: 'Wireless Headphones',
                  category: 'Electronics',
                  price: 99.99,
                },
                {
                  productId: '4',
                  productName: 'Bluetooth Speaker',
                  category: 'Electronics',
                  price: 49.99,
                },
              ];

              await new Promise((resolve) => setTimeout(resolve, 100));

              span.setAttribute('history.items_count', mockHistory.length);
              span.setStatus({ code: SpanStatusCode.OK });

              return {
                ...inputData,
                purchaseHistory: mockHistory,
              };
            } catch (error: any) {
              span.recordException(error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
              throw error;
            } finally {
              span.end();
            }
          },
        );
      },
    }),
  )
  .then(
    createStep({
      id: 'analyze-preferences',
      description: 'Analyze customer preferences and history',
      inputSchema: z.object({
        customerId: z.string(),
        preferences: z.any(),
        purchaseHistory: z.array(z.any()),
      }),
      outputSchema: z.object({
        customerId: z.string(),
        analysisResults: z.object({
          preferredCategories: z.array(z.string()),
          avgSpending: z.number(),
          brandAffinity: z.record(z.number()),
        }),
      }),
      execute: async ({ inputData }) => {
        return await tracer.startActiveSpan(
          'analyze-preferences',
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              'analysis.history_count': inputData.purchaseHistory.length,
            },
          },
          async (span) => {
            try {
              // Simulate ML model inference
              const mlSpan = tracer.startSpan('ml.inference', {
                kind: SpanKind.INTERNAL,
                attributes: {
                  'ml.model': 'preference-analyzer-v1',
                  'ml.task': 'classification',
                },
              });

              await new Promise((resolve) => setTimeout(resolve, 150));

              const analysisResults = {
                preferredCategories: ['Electronics', 'Audio'],
                avgSpending: 74.99,
                brandAffinity: {
                  Sony: 0.8,
                  Bose: 0.7,
                  Apple: 0.6,
                },
              };

              mlSpan.setAttributes({
                'ml.confidence': 0.85,
                'ml.features_count': 12,
              });
              mlSpan.setStatus({ code: SpanStatusCode.OK });
              mlSpan.end();

              span.addEvent('analysis_completed', {
                categories_identified: analysisResults.preferredCategories.length,
              });
              span.setStatus({ code: SpanStatusCode.OK });

              return {
                customerId: inputData.customerId,
                analysisResults,
              };
            } catch (error: any) {
              span.recordException(error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
              throw error;
            } finally {
              span.end();
            }
          },
        );
      },
    }),
  )
  .then(
    createStep({
      id: 'generate-recommendations',
      description: 'Generate personalized product recommendations',
      inputSchema: z.object({
        customerId: z.string(),
        analysisResults: z.any(),
      }),
      outputSchema: z.object({
        recommendations: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            reason: z.string(),
            score: z.number(),
          }),
        ),
      }),
      execute: async ({ inputData, mastra }) => {
        return await tracer.startActiveSpan(
          'generate-recommendations',
          {
            kind: SpanKind.INTERNAL,
            attributes: {
              'recommendations.customer_id': inputData.customerId,
            },
          },
          async (span) => {
            try {
              // Use LLM to generate recommendation reasons
              const recommendationAgent = new Agent({
                name: 'Recommendation Agent',
                instructions: 'Generate personalized product recommendations with clear reasoning.',
                model: openai('gpt-4o-mini'),
              });

              const prompt = `Based on customer preferences for ${inputData.analysisResults.preferredCategories.join(
                ', ',
              )} with average spending of $${
                inputData.analysisResults.avgSpending
              }, recommend these products with personalized reasons:
1. Smart Watch - $299.99
2. Noise Cancelling Earbuds - $149.99
3. Portable Charger - $39.99`;

              const response = await recommendationAgent.generate(prompt);

              // Mock recommendations with LLM-generated reasons
              const recommendations = [
                {
                  productId: '2',
                  productName: 'Smart Watch',
                  reason: 'Perfect for your active lifestyle and pairs well with your audio devices',
                  score: 0.92,
                },
                {
                  productId: '5',
                  productName: 'Noise Cancelling Earbuds',
                  reason: 'Upgrade from your wireless headphones for better portability',
                  score: 0.88,
                },
                {
                  productId: '6',
                  productName: 'Portable Charger',
                  reason: 'Essential accessory for your growing electronics collection',
                  score: 0.75,
                },
              ];

              span.setAttributes({
                'recommendations.count': recommendations.length,
                'recommendations.avg_score': recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length,
              });

              span.addEvent('recommendations_generated', {
                count: recommendations.length,
                llm_used: true,
              });

              span.setStatus({ code: SpanStatusCode.OK });

              return { recommendations };
            } catch (error: any) {
              span.recordException(error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
              throw error;
            } finally {
              span.end();
            }
          },
        );
      },
    }),
  );

recommendationWorkflow.commit();

// Initialize Mastra with telemetry configuration
const mastra = new Mastra({
  agents: { shoppingAssistant },
  workflows: { recommendationWorkflow },
  telemetry: {
    serviceName: 'mastra-advanced-example',
    enabled: true,
    sampling: {
      type: 'ratio',
      probability: 1.0,
    },
  },
});

// Create a single shopping session function that handles all conversations
async function conductShoppingSession(customerId: string, conversations: string[]): Promise<void> {
  const sessionSpan = tracer.startSpan('shopping-session', {
    kind: SpanKind.SERVER,
    attributes: {
      'session.customer_id': customerId,
      'session.conversation_count': conversations.length,
    },
  });

  const sessionContext = trace.setSpan(context.active(), sessionSpan);

  try {
    await context.with(sessionContext, async () => {
      for (let i = 0; i < conversations.length; i++) {
        const message = conversations[i];
        console.log(`Customer: ${message}`);

        const conversationSpan = tracer.startSpan(`conversation-turn-${i + 1}`, {
          kind: SpanKind.INTERNAL,
          attributes: {
            'conversation.turn': i + 1,
            'conversation.message': message,
          },
        });

        try {
          const response = await assistShopping(message, customerId);
          console.log(`Assistant: ${response}\n`);

          conversationSpan.setAttribute('conversation.response_length', response.length);
          conversationSpan.setStatus({ code: SpanStatusCode.OK });
        } catch (error: any) {
          conversationSpan.recordException(error);
          conversationSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          throw error;
        } finally {
          conversationSpan.end();
        }

        // Pause between messages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    });

    sessionSpan.setStatus({ code: SpanStatusCode.OK });
  } catch (error: any) {
    sessionSpan.recordException(error);
    sessionSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    sessionSpan.end();
  }
}

// Modified assist shopping function without creating new root spans
async function assistShopping(message: string, customerId: string): Promise<string> {
  return await tracer.startActiveSpan(
    'shopping-assistance',
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'customer.id': customerId,
        'message.length': message.length,
        'agent.name': 'Shopping Assistant',
      },
    },
    async (span) => {
      try {
        // Add custom baggage for distributed context
        const baggage = propagation.getBaggage(context.active());
        if (baggage) {
          baggage.setEntry('customer.id', { value: customerId });
          baggage.setEntry('session.type', { value: 'shopping' });
        }

        const response = await shoppingAssistant.generate(message, {
          maxSteps: 5,
          stream: false,
        });

        span.setAttributes({
          'response.length': response.text.length,
          'response.steps': response.steps?.length || 0,
          'response.tool_calls': response.toolCalls?.length || 0,
        });

        // Add event for each tool call
        if (response.toolCalls && response.toolCalls.length > 0) {
          response.toolCalls.forEach((toolCall, index) => {
            span.addEvent(`tool_call_${index}`, {
              tool_name: toolCall.toolName,
              tool_args: JSON.stringify(toolCall.args),
            });
          });
        }

        span.setStatus({ code: SpanStatusCode.OK });
        return response.text;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

async function generateRecommendations(customerId: string): Promise<any> {
  return await tracer.startActiveSpan(
    'recommendation-generation',
    {
      kind: SpanKind.SERVER,
      attributes: {
        'workflow.name': 'product-recommendation-workflow',
        'customer.id': customerId,
      },
    },
    async (span) => {
      try {
        const workflow = mastra.getWorkflow('recommendationWorkflow');
        const { start } = workflow.createRun();

        const result = await start({
          inputData: {
            customerId,
            preferences: {
              categories: ['Electronics', 'Audio'],
              priceRange: { min: 30, max: 300 },
            },
          },
        });

        if (result.status === 'success') {
          span.setAttributes({
            'workflow.status': 'success',
            'recommendations.count': result.result.recommendations.length,
          });
          span.setStatus({ code: SpanStatusCode.OK });
          return result.result;
        } else {
          span.setAttributes({
            'workflow.status': 'failed',
            'workflow.error': result.error?.message || 'Unknown error',
          });
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Workflow failed' });
          throw new Error('Recommendation workflow failed');
        }
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

// Wrap the entire shopping session with a single Gentrace interaction
const shoppingSessionInteraction = interaction('Shopping Session', conductShoppingSession, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

const recommendationInteraction = interaction('Recommendation Workflow', generateRecommendations, {
  pipelineId: GENTRACE_PIPELINE_ID,
});

// Main function demonstrating advanced features
async function main() {
  console.log('Advanced Mastra + Gentrace OpenTelemetry Example\n');
  console.log('This example demonstrates:');
  console.log('- Agent memory for contextual conversations');
  console.log('- Complex multi-step workflows');
  console.log('- Custom OpenTelemetry spans and events');
  console.log('- Tool execution with detailed telemetry');
  console.log('- Distributed context propagation\n');
  console.log('─'.repeat(80) + '\n');

  const customerId = 'CUST-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Demonstrate shopping assistant with memory - all in one trace
  console.log('🛍️  Shopping Assistant Demo\n');

  const conversations = [
    "Hi! I'm looking for some new electronics for my home office.",
    'Can you show me wireless headphones under $150?',
    "I like the second option. Can you also find a good webcam?",
    "Actually, let's go with the headphones. Can you process an order for product ID 1?",
  ];

  await shoppingSessionInteraction(customerId, conversations);

  console.log('─'.repeat(80) + '\n');

  // Demonstrate recommendation workflow - separate trace
  console.log('🎯  Recommendation Workflow Demo\n');
  console.log(`Generating personalized recommendations for customer ${customerId}...\n`);

  try {
    const recommendations = await recommendationInteraction(customerId);
    console.log('Personalized Recommendations:');
    recommendations.recommendations.forEach((rec: any, index: number) => {
      console.log(`\n${index + 1}. ${rec.productName} (Score: ${rec.score})`);
      console.log(`   Reason: ${rec.reason}`);
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n✅ Example completed! Check your Gentrace dashboard for detailed traces.');
}

main().catch(console.error);
