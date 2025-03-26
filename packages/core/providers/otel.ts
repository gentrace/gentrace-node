import { trace, context, SpanStatusCode } from "@opentelemetry/api";
import stringify from "fast-safe-stringify";

const ATTRIBUTES = {
  PIPELINE_ID: "gentrace.pipelineId",
} as const;

const EVENTS = {
  ARGS: "gentrace.fn.args",
  OUTPUT: "gentrace.fn.output",
} as const;

const EVENT_ATTRIBUTES = {
  ARGS: "args",
  OUTPUT: "output",
  NUM_ARGS: "numArgs",
  ASYNC: "async",
} as const;

type WrapInteractionOptions = {
  pipelineId: string;
  name?: string | undefined;
  attributes?: Record<string, any>;
};

const isPromise = (value: any): value is Promise<any> => {
  return typeof value === "object" && value !== null && "then" in value;
};

export function wrapInteraction<T extends (...args: any[]) => any>(
  fn: T,
  options: WrapInteractionOptions,
): (...args: Parameters<T>) => ReturnType<T> {
  const tracer = trace.getTracer("gentrace");

  return function wrappedFunction(...args: Parameters<T>): ReturnType<T> {
    // Start a new span with provided options
    const span = tracer.startSpan(
      (options.name ?? fn.name) || "wrapInteraction.fn",
      {
        attributes: {
          ...options.attributes,
          [ATTRIBUTES.PIPELINE_ID]: options.pipelineId,
        },
      },
    );

    // Capture the active context with the new span
    const activeContext = trace.setSpan(context.active(), span);

    let result;
    try {
      span.addEvent(EVENTS.ARGS, {
        [EVENT_ATTRIBUTES.ARGS]: stringify(args),
        [EVENT_ATTRIBUTES.NUM_ARGS]: args.length,
      });
      result = context.with(activeContext, () => {
        return fn(...args);
      });
    } catch (error) {
      // Handle synchronous errors
      try {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.end();
      } catch (e) {
        // ignore additional errors
      } finally {
        throw error;
      }
    }

    if (isPromise(result)) {
      // Bind then and catch callbacks to the captured active context
      const boundThen = context.bind(activeContext, (value: any) => {
        try {
          span.addEvent(EVENTS.OUTPUT, {
            [EVENT_ATTRIBUTES.OUTPUT]: stringify(value),
            [EVENT_ATTRIBUTES.ASYNC]: true,
          });
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (e) {
          // ignore errors in the span handling
        } finally {
          span.end();
        }
        return value;
      });

      const boundCatch = context.bind(activeContext, (error: any) => {
        try {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
        } catch (e) {
          // ignore errors in the span handling
        } finally {
          span.end();
        }
        throw error;
      });

      return result.then(boundThen).catch(boundCatch) as ReturnType<T>;
    } else {
      try {
        span.addEvent(EVENTS.OUTPUT, {
          [EVENT_ATTRIBUTES.OUTPUT]: stringify(result),
          [EVENT_ATTRIBUTES.ASYNC]: false,
        });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (e) {
        // ignore errors in the span handling
      } finally {
        span.end();
      }
      return result;
    }
  };
}
