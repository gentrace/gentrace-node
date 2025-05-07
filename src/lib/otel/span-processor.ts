import { Context, propagation } from '@opentelemetry/api';
import { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { GENTRACE_SAMPLE_KEY } from './constants';

/**
 * A function that determines whether a baggage key-value pair should be added to new
 * log record as a log attribute.
 */
export type GentraceKeyPredicate = (baggageKey: string) => boolean;

/**
 * A span processor that extracts Gentrace-specific baggage from the context
 * and adds it as span attributes. This processor is used to propagate
 * Gentrace-specific context across service boundaries.
 *
 * Most of this functionality is adapted from @opentelemetry/baggage-span-processor
 * but avoids importing it directly to keep the peer dependency requirements minimal.
 */
export class GentraceSpanProcessor implements SpanProcessor {
  /**
   * Forces to export all finished spans
   */
  forceFlush(): Promise<void> {
    // no-op
    return Promise.resolve();
  }

  /**
   * Called when a {@link Span} is started, if the `span.isRecording()`
   * returns true.
   * @param span the Span that just started.
   */
  onStart(span: Span, parentContext: Context): void {
    (propagation.getBaggage(parentContext)?.getAllEntries() ?? [])
      .filter((entry) => entry[0] === GENTRACE_SAMPLE_KEY)
      .forEach((entry) => span.setAttribute(entry[0], entry[1].value));
  }

  /**
   * Called when a {@link ReadableSpan} is ended, if the `span.isRecording()`
   * returns true.
   * @param span the Span that just ended.
   */
  onEnd(_: ReadableSpan): void {
    // no-op
  }

  /**
   * Shuts down the processor. Called when SDK is shut down. This is an
   * opportunity for processor to do any cleanup required.
   */
  shutdown(): Promise<void> {
    // no-op
    return Promise.resolve();
  }
}
