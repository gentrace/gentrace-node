import { wrapInteraction } from "../providers/otel";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";

// Mock types
type MockSpan = {
  recordException: jest.Mock;
  setStatus: jest.Mock;
  end: jest.Mock;
  addEvent: jest.Mock;
};

type MockTracer = {
  startSpan: jest.Mock;
};

// Mock OpenTelemetry API
jest.mock("@opentelemetry/api", () => {
  const mockSpan = {
    startSpan: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    end: jest.fn(),
  };

  const mockTracer = {
    startSpan: jest.fn().mockReturnValue(mockSpan),
  };

  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
      setSpan: jest.fn().mockImplementation((ctx, span) => ctx),
    },
    context: {
      active: jest.fn().mockReturnValue({}),
      with: jest.fn().mockImplementation((ctx, fn) => fn()),
    },
    SpanStatusCode: {
      OK: "OK",
      ERROR: "ERROR",
    },
  };
});

describe("wrapInteraction", () => {
  let mockSpan: MockSpan;
  let mockTracer: MockTracer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSpan = {
      recordException: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
      addEvent: jest.fn(),
    };
    mockTracer = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
    };
    (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);
  });

  test("should wrap a synchronous function correctly", () => {
    // Setup
    const syncFn = (a: number, b: number) => a + b;
    const wrapped = wrapInteraction(syncFn, {
      pipelineId: "test-pipeline",
      name: "test-sync",
    });

    // Execute
    const result = wrapped(2, 3);

    // Assert
    expect(result).toBe(5);
    expect(trace.getTracer).toHaveBeenCalledWith("llm-tracer");
    expect(mockTracer.startSpan).toHaveBeenCalledWith("test-sync", {
      attributes: { "gentrace.pipelineId": "test-pipeline" },
    });
    expect(context.with).toHaveBeenCalled();
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2); // Args and output events
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.OK,
    });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  test("should handle attributes correctly", () => {
    // Setup
    const syncFn = () => "test";
    const attributes = { operation: "testing", userId: "123" };
    const wrapped = wrapInteraction(syncFn, {
      pipelineId: "test-pipeline",
      name: "test-with-attributes",
      attributes,
    });

    // Execute
    wrapped();

    // Assert
    expect(mockTracer.startSpan).toHaveBeenCalledWith("test-with-attributes", {
      attributes: {
        ...attributes,
        "gentrace.pipelineId": "test-pipeline",
      },
    });
  });

  test("should use function name when name is not provided", () => {
    // Setup
    function namedFunction() {
      return "result";
    }
    const wrapped = wrapInteraction(namedFunction, {
      pipelineId: "test-pipeline",
    });

    // Execute
    wrapped();

    // Assert
    expect(mockTracer.startSpan).toHaveBeenCalledWith(
      "namedFunction",
      expect.any(Object),
    );
  });

  test("should handle synchronous errors", () => {
    // Setup
    const error = new Error("Sync error");
    const failingFn = () => {
      throw error;
    };
    const wrapped = wrapInteraction(failingFn, {
      pipelineId: "test-pipeline",
      name: "test-sync-error",
    });

    // Execute & Assert
    expect(() => wrapped()).toThrow(error);
    expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: "Sync error",
    });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  test("should wrap an async function correctly", async () => {
    // Setup
    const asyncFn = async (a: number, b: number) => a + b;
    const wrapped = wrapInteraction(asyncFn, {
      pipelineId: "test-pipeline",
      name: "test-async",
    });

    // Execute
    const result = await wrapped(2, 3);

    // Assert
    expect(result).toBe(5);
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2); // Args and output events
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.OK,
    });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  test("should handle async errors", async () => {
    // Setup
    const error = new Error("Async error");
    const failingAsyncFn = async () => {
      throw error;
    };
    const wrapped = wrapInteraction(failingAsyncFn, {
      pipelineId: "test-pipeline",
      name: "test-async-error",
    });

    // Execute & Assert
    await expect(wrapped()).rejects.toThrow(error);
    expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: "Async error",
    });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  test("should handle non-Error objects thrown", () => {
    // Setup
    const nonError = "string error";
    const failingFn = () => {
      throw nonError;
    };
    const wrapped = wrapInteraction(failingFn, {
      pipelineId: "test-pipeline",
      name: "test-non-error",
    });

    // Execute & Assert
    expect(() => wrapped()).toThrow(nonError);
    expect(mockSpan.recordException).toHaveBeenCalledWith(nonError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: "string error",
    });
  });

  test("should handle promise rejections with non-Error values", async () => {
    // Setup
    const nonError = "string rejection";
    const failingAsyncFn = async () => {
      return Promise.reject(nonError);
    };
    const wrapped = wrapInteraction(failingAsyncFn, {
      pipelineId: "test-pipeline",
      name: "test-async-non-error",
    });

    // Execute & Assert
    await expect(wrapped()).rejects.toBe(nonError);
    expect(mockSpan.recordException).toHaveBeenCalledWith(nonError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: "string rejection",
    });
  });

  test("should record events for arguments and output", () => {
    // Setup
    const fn = (a: number, b: string) => ({ result: a + b });
    const wrapped = wrapInteraction(fn, {
      pipelineId: "test-pipeline",
      name: "test-events",
    });

    // Execute
    wrapped(42, "test");

    // Assert
    expect(mockSpan.addEvent).toHaveBeenCalledTimes(2);
    expect(mockSpan.addEvent).toHaveBeenNthCalledWith(1, "gentrace.fn.args", {
      args: expect.any(String),
      numArgs: 2,
    });
    expect(mockSpan.addEvent).toHaveBeenNthCalledWith(2, "gentrace.fn.output", {
      output: expect.any(String),
      async: false,
    });
  });
});
