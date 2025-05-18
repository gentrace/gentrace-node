import { Context, propagation } from '@opentelemetry/api';
import { Sampler, SamplingDecision, SamplingResult } from '@opentelemetry/sdk-trace-base';
import { Attributes, Link, SpanKind } from '@opentelemetry/api';
import { ATTR_GENTRACE_SAMPLE } from './constants';

/**
 * A sampler that samples spans based on the presence of a 'gentrace.sample' baggage entry
 * or span attribute. If either is set to 'true', the span will be sampled.
 */
export class GentraceSampler implements Sampler {
  /**
   * Determines whether a span should be sampled based on the presence of a 'gentrace.sample'
   * (GENTRACE_SAMPLE_KEY) baggage entry or span attribute.
   *
   * @param context - The current context.
   * @param traceId - The trace ID of the span.
   * @param spanName - The name of the span.
   * @param spanKind - The kind of the span.
   * @param attributes - The attributes of the span.
   * @param links - The links of the span.
   * @returns A sampling result indicating whether the span should be sampled.
   */
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    const currentMomentBaggage = propagation.getBaggage(context);
    const sampleEntry = currentMomentBaggage?.getEntry(ATTR_GENTRACE_SAMPLE);

    if (
      (currentMomentBaggage && sampleEntry?.value === 'true') ||
      attributes[ATTR_GENTRACE_SAMPLE] === 'true'
    ) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    } else {
      return { decision: SamplingDecision.NOT_RECORD };
    }
  }

  toString(): string {
    return 'GentraceSampler';
  }
}
