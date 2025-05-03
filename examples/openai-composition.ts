import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { readEnv } from 'gentrace/internal/utils';
import { init } from '../src/lib/init';
import { interaction } from '../src/lib/interaction';
import { composeEmail } from './functions/composition';
import { Attributes, Context, Link, propagation, SpanKind } from '@opentelemetry/api';
import { BaggageSpanProcessor } from '@opentelemetry/baggage-span-processor';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  ConsoleSpanExporter,
  Sampler,
  SamplingDecision,
  SamplingResult,
  SimpleSpanProcessor,
  SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { OpenAIInstrumentation } from '@traceloop/instrumentation-openai';
import process from 'process';

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

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'openai-email-composition-simplified',
});

class GentraceSampler implements Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    const currentMomentBaggage = propagation.getBaggage(context);
    const sampleEntry = currentMomentBaggage?.getEntry('gentrace.sample');

    if ((currentMomentBaggage && sampleEntry?.value === 'true') || attributes['gentrace.sample'] === 'true') {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    } else {
      return { decision: SamplingDecision.NOT_RECORD };
    }
  }

  toString(): string {
    return 'GentraceSampler';
  }
}

const contextManager = new AsyncLocalStorageContextManager();
contextManager.enable();

const isEdgeRuntime = process.env['NEXT_RUNTIME'] === 'edge';
const instrumentations =
  isEdgeRuntime ?
    []
  : [
      new OpenAIInstrumentation({
        exceptionLogger: (e: Error) => {
          console.error('Error logging OpenAI exception', e);
        },
      }),
    ];

const baggageProcessor = new BaggageSpanProcessor((baggageKey: string) => {
  console.log('baggageKey', baggageKey);
  return baggageKey === 'gentrace.sample';
});

let spanProcessors: SpanProcessor[];
let sampler: Sampler | undefined = undefined;

if (process.env['ENVIRONMENT'] === 'production') {
  // In production, we head sample using the gentrace.sample attribute
  // in the OTEL collector. The baggage processor moves the gentrace.sample
  // attribute to the trace attributes, as the baggage won't be available
  // in the collector.
  spanProcessors = [baggageProcessor];
  resource.attributes['env'] = 'production';
  resource.attributes['node.env'] = 'production';
} else {
  console.log('Development environment detected');
  const traceExporter = new OTLPTraceExporter({
    url: `${GENTRACE_BASE_URL}/otel/v1/traces`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${readEnv('GENTRACE_API_KEY')}`,
    },
  });

  // In development, we need to manually setup the sampling and exporter.
  // Note: the sampler runs BEFORE the baggage processor, so we need to
  // check both baggage and attributes.
  spanProcessors = [
    baggageProcessor,
    new SimpleSpanProcessor(traceExporter),
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ];
  sampler = new GentraceSampler();

  resource.attributes['env'] = 'development';
  resource.attributes['node.env'] = 'development';
}

// Begin OpenTelemetry SDK setup
const sdk = new NodeSDK({
  resource,
  instrumentations,
  spanProcessors,
  ...(sampler && { sampler }), // Conditionally add sampler if defined
  contextManager,
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

const compose = interaction(GENTRACE_PIPELINE_ID, composeEmail);

async function main() {
  const draft = await compose('Alice', 'Project Phoenix Update', 'John Doe');
  console.log('Draft:', draft);
}

main();
