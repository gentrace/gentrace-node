import {
  GENTRACE_API_KEY,
  GENTRACE_ENVIRONMENT_NAME,
  getGentraceBasePath,
  globalGentraceConfig,
} from "./init";
import { Pipeline } from "./pipeline";
import { updateTestResultWithRunners } from "./runners";
import type { ZodType } from "zod";
import WebSocket from "ws";
import { AsyncLocalStorage } from "async_hooks";
import * as Mustache from "mustache";
import { BASE_PATH } from "../base";

type InteractionFn<T = any> = (...args: [T, ...any[]]) => any;

type InteractionDefinition<
  T extends any = any,
  Fn extends InteractionFn<T> = InteractionFn<T>,
> = {
  name: string;
  fn: Fn;
  parameters?: undefined | { name: string }[];
  inputType?: undefined | ZodType<T>;
};

const interactions: Record<string, InteractionDefinition> = {};

export function defineInteraction<
  T = any,
  Fn extends InteractionFn<T> = InteractionFn<T>,
>(interaction: InteractionDefinition<T, Fn>): Fn {
  interactions[interaction.name] = interaction;
  Object.values(listeners).forEach((listener) =>
    listener({
      type: "register-interaction",
      interaction,
    }),
  );
  return interaction.fn;
}

type AnyFn = (...args: any[]) => any;
type TestSuiteDefinition = {
  name: string;
  fn: AnyFn;
};

const testSuites: Record<string, TestSuiteDefinition> = {};
export function defineTestSuite<Fn extends AnyFn>(testSuite: {
  name: string;
  fn: Fn;
}): Fn {
  testSuites[testSuite.name] = testSuite;
  Object.values(listeners).forEach((listener) =>
    listener({
      type: "register-test-suite",
      testSuite,
    }),
  );
  return testSuite.fn;
}

const getWSBasePath = () => {
  const apiBasePath = getGentraceBasePath();
  if (apiBasePath === "") {
    return "wss://gentrace.ai/ws";
  }
  if (apiBasePath.includes("localhost")) {
    return "ws://localhost:3001";
  }
  return (
    "wss://" +
    apiBasePath.slice(
      apiBasePath.indexOf("/") + 2,
      apiBasePath.lastIndexOf("/"),
    ) +
    "/ws"
  );
};

type Listener = (
  event:
    | { type: "register-test-suite"; testSuite: TestSuiteDefinition }
    | { type: "register-interaction"; interaction: InteractionDefinition },
) => void;
const listeners: Record<string, Listener> = {};

type InboundMessageTestInteractionInputs = {
  type: "run-interaction-input-validation";
  id: string;
  interactionName: string;
  data: { id: string; inputs: any }[];
};

type InboundMessageRunTestInteraction = {
  type: "run-test-interaction";
  pipelineId: string;
  parallelism?: number | undefined;
  testJobId: string;
  interactionName: string;
  data: { id: string; inputs: any }[];
  overrides: Record<string, any>;
};

type InboundMessageRunTestSuite = {
  type: "run-test-suite";
  pipelineId: string;
  parallelism?: number | undefined;
  testJobId: string;
  testSuiteName: string;
};

type InboundMessageEnvironmentDetails = {
  type: "environment-details";
  id: string;
};

type InboundMessage =
  | InboundMessageEnvironmentDetails
  | InboundMessageTestInteractionInputs
  | InboundMessageRunTestInteraction
  | InboundMessageRunTestSuite;

type OutboundMessageHeartbeat = {
  type: "heartbeat";
};

type InteractionMetadata = {
  name: string;
  hasValidation: boolean;
  parameters: Parameter[];
};

type OutboundMessageRegisterInteraction = {
  type: "register-interaction";
  interaction: InteractionMetadata;
};

type OutboundMessageRegisterTestSuite = {
  type: "register-test-suite";
  testSuite: {
    name: string;
  };
};

type OutboundMessageTestInteractionInputValidationResults = {
  type: "run-interaction-input-validation-results";
  id: string;
  interactionName: string;
  data: { id: string; status: "success" | "failure"; error?: string }[];
};

type OutboundMessageEnvironmentDetails = {
  type: "environment-details";
  interactions: InteractionMetadata[];
  testSuites: { name: string }[];
};

type OutboundMessageConfirmation = {
  type: "confirmation";
  ok: boolean;
};

type OutboundMessage =
  | OutboundMessageHeartbeat
  | OutboundMessageEnvironmentDetails
  | OutboundMessageRegisterInteraction
  | OutboundMessageRegisterTestSuite
  | OutboundMessageTestInteractionInputValidationResults
  | OutboundMessageConfirmation;

const makeUuid = () => {
  // Generate 16 random bytes
  const bytes: number[] = new Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  // Set the version number to 4 (UUID version 4)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set the variant to 10xxxxxx (RFC 4122 variant)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Convert bytes to hex and format as UUID
  const hexBytes = bytes.map((byte) => ("0" + byte.toString(16)).slice(-2));

  return [
    hexBytes.slice(0, 4).join(""),
    hexBytes.slice(4, 6).join(""),
    hexBytes.slice(6, 8).join(""),
    hexBytes.slice(8, 10).join(""),
    hexBytes.slice(10, 16).join(""),
  ].join("-");
};

const validate = async (
  interaction: InteractionDefinition,
  { id, inputs }: { id: string; inputs: any },
): Promise<
  | { status: "success"; id: string }
  | { status: "failure"; error: string; id: string }
> => {
  if (!interaction.inputType) {
    return {
      status: "failure",
      error: "No input validator found",
      id,
    };
  }
  try {
    await interaction.inputType.parseAsync(inputs);
    return { status: "success", id };
  } catch (e) {
    return {
      status: "failure",
      error: e?.message ?? "Validation failed",
      id,
    };
  }
};

const overridesAsyncLocalStorage = new AsyncLocalStorage<Record<string, any>>();
const makeGetValue = <T>(name: string, defaultValue: T): (() => T) => {
  return () => {
    const overrides = overridesAsyncLocalStorage.getStore();
    return overrides?.[name] ?? defaultValue;
  };
};

const parameters: Record<string, Parameter> = {};

type Parameter =
  | {
      type: "numeric";
      name: string;
      defaultValue: number;
    }
  | {
      type: "string";
      name: string;
      defaultValue: string;
    }
  | {
      type: "enum";
      name: string;
      defaultValue: string;
      options: string[];
    }
  | {
      type: "template";
      name: string;
      defaultValue: string;
    };

export const numericParameter = ({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number;
}) => {
  parameters[name] = {
    name,
    type: "numeric",
    defaultValue,
  };
  return {
    name,
    getValue: makeGetValue(name, defaultValue),
  };
};

export const stringParameter = ({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) => {
  parameters[name] = {
    name,
    type: "string",
    defaultValue,
  };
  return {
    name,
    getValue: makeGetValue(name, defaultValue),
  };
};

export const enumParameter = ({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[];
  defaultValue: string;
}) => {
  parameters[name] = {
    name,
    type: "enum",
    defaultValue,
    options,
  };
  return {
    name,
    getValue: makeGetValue(name, defaultValue),
  };
};

export const templateParameter = ({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) => {
  parameters[name] = {
    name,
    type: "template",
    defaultValue,
  };
  return {
    name,
    render: (values: Record<string, any>) => {
      const overrides = overridesAsyncLocalStorage.getStore();
      const template = overrides?.[name] ?? defaultValue;
      return Mustache.render(template, values);
    },
  };
};

function makeParallelRunner(parallelism?: undefined | number) {
  const results: Promise<any>[] = [];
  const queue: {
    fn: AnyFn;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }[] = [];
  let numRunning = 0;

  function processQueue() {
    while ((!parallelism || numRunning < parallelism) && queue.length > 0) {
      const { fn, resolve, reject } = queue.shift()!;
      numRunning++;
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          numRunning--;
          processQueue();
        });
    }
  }

  return {
    results,
    run: async (fn: AnyFn) => {
      results.push(
        new Promise((res, rej) => {
          queue.push({ fn, resolve: res, reject: rej });
        }),
      );
      processQueue();
    },
  };
}

type WebSocketTransport = {
  type: "ws";
  pluginId: string;
  ws: WebSocket;
  isClosed: boolean;
  messageQueue: any[];
};

type HttpTransport = {
  type: "http";
  sendResponse: (responseBody: any) => void;
};

type Transport = WebSocketTransport | HttpTransport;

async function sendMessage(message: OutboundMessage, transport: Transport) {
  if (transport.type === "ws") {
    if (!transport.pluginId) {
      transport.messageQueue.push(message);
      return;
    }
    if (transport.isClosed) {
      return;
    }
    transport.ws.send(
      JSON.stringify({
        id: makeUuid(),
        for: transport.pluginId,
        data: message,
      }),
    );
  } else {
    transport.sendResponse(message);
  }
}

const handleRunInteractionInputValidation = async (
  message: InboundMessageTestInteractionInputs,
  transport: Transport,
) => {
  const { id, interactionName, data: testCases } = message;
  const interaction = interactions[interactionName];
  if (!interaction) {
    sendMessage(
      {
        type: "run-interaction-input-validation-results",
        id,
        interactionName,
        data: testCases.map((tc) => ({
          id: tc.id,
          status: "failure",
          error: `Interaction ${interactionName} not found`,
        })),
      },
      transport,
    );
  }
  const validationResults = await Promise.all(
    testCases.map((testCase) => validate(interaction, testCase)),
  );
  sendMessage(
    {
      type: "run-interaction-input-validation-results",
      id,
      interactionName,
      data: validationResults,
    },
    transport,
  );
};

const runTestCaseThroughInteraction = async (
  pipelineId: string,
  testJobId: string,
  interactionName: string,
  testCase: { id: string; inputs: any },
) => {
  const pipeline = new Pipeline<{}>({
    id: pipelineId,
  });
  const interaction = interactions[interactionName];

  if (!interaction) {
    // TODO: submit error to gentrace
    return;
  }
  const runner = pipeline.start();
  try {
    try {
      await runner.measure(interaction.fn, [testCase.inputs]);
    } catch (e) {
      runner.setError(e.toString());
    }
    await updateTestResultWithRunners(testJobId, [
      [runner, { id: testCase.id }],
    ]);
  } catch (e) {
    // TODO: submit error to gentrace
    console.error(e);
    throw e;
  }
};

const handleRunTestInteraction = async (
  message: InboundMessageRunTestInteraction,
) => {
  const {
    testJobId,
    pipelineId,
    interactionName,
    parallelism,
    data: testCases,
    overrides,
  } = message;
  const interaction = interactions[interactionName];
  if (!interaction) {
    return;
  }
  overridesAsyncLocalStorage.run(overrides, async () => {
    const overrides = overridesAsyncLocalStorage.getStore();
    console.log("overrides", overrides);
    const parallelRunner = makeParallelRunner(parallelism);
    for (const testCase of testCases) {
      parallelRunner.run(() =>
        runTestCaseThroughInteraction(
          pipelineId,
          testJobId,
          interactionName,
          testCase,
        ),
      );
    }
    const results = await Promise.allSettled(parallelRunner.results);
    const erroredResults = results.filter<PromiseRejectedResult>(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (erroredResults.length > 0) {
      console.error(
        "Errors in test job:",
        erroredResults.map((r) => r.reason),
      );
    }
    const apiBasePath = globalGentraceConfig.basePath || BASE_PATH;
    await fetch(`${apiBasePath}/v1/test-result/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(globalGentraceConfig.baseOptions?.headers ?? {}),
      },
      body: JSON.stringify({
        id: testJobId,
        finished: true,
      }),
    });
  });
};

const handleRunTestSuite = async (message: InboundMessageRunTestSuite) => {
  const { testSuiteName, testJobId, pipelineId } = message;
  const testSuite = testSuites[testSuiteName];
  if (!testSuite) {
    return;
  }
  await testSuite.fn();
  const apiBasePath = globalGentraceConfig.basePath || BASE_PATH;
  await fetch(`${apiBasePath}/v1/test-result/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(globalGentraceConfig.baseOptions?.headers ?? {}),
    },
    body: JSON.stringify({
      id: testJobId,
      finished: true,
    }),
  });
};

const onInteraction = (
  interaction: InteractionDefinition,
  transport: Transport,
) => {
  sendMessage(
    {
      type: "register-interaction",
      interaction: {
        name: interaction.name,
        hasValidation: !!interaction.inputType,
        parameters:
          interaction.parameters
            ?.map(({ name }) => parameters[name])
            .filter((v) => !!v) ?? [],
      },
    },
    transport,
  );
};

const onTestSuite = (testSuite: TestSuiteDefinition, transport: Transport) => {
  sendMessage(
    {
      type: "register-test-suite",
      testSuite: {
        name: testSuite.name,
      },
    },
    transport,
  );
};

const handleEnvironmentDetails = async (
  message: InboundMessageEnvironmentDetails,
  transport: Transport,
) => {
  sendMessage(
    {
      type: "environment-details",
      interactions: Object.values(interactions).map((interaction) => ({
        name: interaction.name,
        hasValidation: !!interaction.inputType,
        parameters:
          interaction.parameters?.map(({ name }) => parameters[name]) ?? [],
      })),
      testSuites: Object.values(testSuites).map((testSuite) => ({
        name: testSuite.name,
      })),
    },
    transport,
  );
};

const onMessage = async (message: InboundMessage, transport: Transport) => {
  switch (message.type) {
    case "environment-details":
      await handleEnvironmentDetails(message, transport);
      break;
    case "run-interaction-input-validation":
      await handleRunInteractionInputValidation(message, transport);
      break;
    case "run-test-interaction":
      // Immediately send confirmation to avoid timeout, then run everything
      // else async
      sendMessage(
        {
          type: "confirmation",
          ok: true,
        },
        transport,
      );
      await handleRunTestInteraction(message);
      break;
    case "run-test-suite":
      sendMessage(
        {
          type: "confirmation",
          ok: true,
        },
        transport,
      );
      await handleRunTestSuite(message);
      break;
  }
};

async function runWebSocket(
  environmentName: string | undefined,
  resolve: () => void,
  reject: (error: Error) => void,
) {
  const wsBasePath = getWSBasePath();
  let env = environmentName ?? GENTRACE_ENVIRONMENT_NAME;
  if (!env) {
    try {
      const os = await import("os");
      env = os.hostname();
    } catch (error) {
      reject(new Error("Gentrace environment name is not set"));
      return;
    }
  }

  const transport: WebSocketTransport = {
    type: "ws",
    pluginId: undefined,
    ws: new WebSocket(wsBasePath),
    isClosed: false,
    messageQueue: [],
  };

  const id = makeUuid();
  let intervals: ReturnType<typeof setInterval>[] = [];

  const sendMessage = (message: OutboundMessage) => {
    if (!transport.pluginId) {
      transport.messageQueue.push(message);
      return;
    }
    if (transport.isClosed) {
      return;
    }
    console.log("WebSocket sending message:", JSON.stringify(message, null, 2));
    transport.ws.send(
      JSON.stringify({
        id: makeUuid(),
        for: transport.pluginId,
        data: message,
      }),
    );
  };

  const setup = () => {
    transport.messageQueue.forEach(sendMessage);
    intervals.push(
      setInterval(() => {
        console.log("sending heartbeat");
        sendMessage({
          type: "heartbeat",
        });
      }, 30 * 1000),
    );
  };

  const cleanup = () => {
    transport.isClosed = true;
    delete listeners[id];
    intervals.forEach(clearInterval);
    intervals = [];
  };

  transport.ws.onopen = () => {
    if (transport.isClosed) {
      return;
    }
    console.log("WebSocket connection opened, sending setup message");
    transport.ws.send(
      JSON.stringify({
        id: makeUuid(),
        init: "test-job-runner",
        data: {
          type: "setup",
          environmentName: env,
          apiKey: GENTRACE_API_KEY,
        },
      }),
    );

    // WSS layer, not plugin layer
    intervals.push(
      setInterval(() => {
        if (transport.isClosed) {
          return;
        }
        console.log("sending ping");
        transport.ws.send(
          JSON.stringify({
            id: makeUuid(),
            ping: true,
          }),
        );
      }, 30 * 1000),
    );
  };

  transport.ws.onmessage = async (event) => {
    if (transport.isClosed) {
      return;
    }
    console.log("WebSocket message received:", event.data);

    const messageWrapper = JSON.parse(
      typeof event.data === "string" ? event.data : event.data.toString(),
    );
    if (messageWrapper?.data?.pluginId) {
      transport.pluginId = messageWrapper.data.pluginId;
      setup();
      return;
    }

    if (messageWrapper?.error) {
      console.error("WebSocket error:", messageWrapper.error);
      reject(new Error(JSON.stringify(messageWrapper.error, null, 2)));
      return;
    }

    try {
      const message = messageWrapper.data as InboundMessage;
      await onMessage(message, transport);
    } catch (e) {
      console.error("Error in WebSocket message handler:", e);
      reject(e);
    }
  };

  transport.ws.onclose = () => {
    if (transport.isClosed) {
      return;
    }
    cleanup();
    console.log("WebSocket connection closed");
    reject(new Error("WebSocket connection closed"));
  };

  transport.ws.onerror = (error) => {
    console.error("Gentrace websocket error:", error);
  };

  // wait for close signal from process
  process.on("SIGINT", () => {
    if (transport.isClosed) {
      return;
    }
    console.log("Received SIGINT, closing WebSocket connection");
    cleanup();
    transport.ws.close();
    resolve();
  });

  process.on("SIGTERM", () => {
    if (transport.isClosed) {
      return;
    }
    console.log("Received SIGTERM, closing WebSocket connection");
    cleanup();
    transport.ws.close();
    resolve();
  });

  Object.values(interactions).forEach((interaction) =>
    onInteraction(interaction, transport),
  );
  Object.values(testSuites).forEach((testSuite) =>
    onTestSuite(testSuite, transport),
  );

  listeners[id] = (event) => {
    switch (event.type) {
      case "register-interaction":
        onInteraction(event.interaction, transport);
        break;
      case "register-test-suite":
        onTestSuite(event.testSuite, transport);
        break;
    }
  };
}

async function listenInner({
  environmentName,
  retries = 0,
}: {
  environmentName?: string | undefined;
  retries?: number;
}): Promise<void> {
  if (!GENTRACE_API_KEY) {
    throw new Error("Gentrace API key is not set");
  }
  let isClosingProcess = false;
  process.on("SIGINT", () => {
    isClosingProcess = true;
  });

  process.on("SIGTERM", () => {
    isClosingProcess = true;
  });

  try {
    const closePromise = new Promise<void>((resolve, reject) =>
      runWebSocket(environmentName, resolve, reject),
    );
    await closePromise;
  } catch (e) {
    console.error("Error in WebSocket connection:", e);
    if (isClosingProcess) {
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(Math.pow(2, retries) * 250, 10 * 1000)),
    );
    if (isClosingProcess) {
      return;
    }
    return await listenInner({ environmentName, retries: retries + 1 });
  }
}

export function listen(values?: {
  environmentName?: string | undefined;
}): Promise<void> {
  const { environmentName } = values ?? {};
  return listenInner({ environmentName, retries: 0 });
}

export async function handleWebhook(
  body: any,
  sendResponse: (response: OutboundMessage) => void,
): Promise<void> {
  console.log("Gentrace HTTP message received:", body);
  await onMessage(body, {
    type: "http",
    sendResponse,
  });
}
