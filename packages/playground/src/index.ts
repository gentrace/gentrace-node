import { getGentraceApiKey, getGentraceBasePath } from "@gentrace/core";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import stringify from "json-stable-stringify";

export { init } from "@gentrace/core"; // for accessing the Gentrace API key

import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();

type CustomObject = {
  typeName: string;
  objectName: string;
  object: object;
};

type TInput = Record<string, any>;
type TOutput = Record<string, any>;

type InteractionObject = {
  name: string;
  inputFields: TInput;
  outputFields: TOutput;
  interaction: (inputs: { [K in keyof TInput]?: any }) => {
    [K in keyof TOutput]?: any;
  };
};

// step ID to cachedInputString
const cachedStepInputs: Map<string, string> = new Map();

// cachedInputString to output
const cachedStepOutputs: Map<string, string> = new Map();

export class GentraceSession {
  registeredCustomTypes: string[] = [];
  registeredCustomObjects: CustomObject[] = [];
  registeredInteractionObjects: InteractionObject[] = [];
  submittedStepOutputs: Map<string, string> = new Map(); // step ID to output string

  // get a WebSocket URL based on the Gentrace base path

  private getWebSocketUrl(): string {
    let webSocketUrl;
    //  basePath example: "https://staging.gentrace.ai/api",

    const basePath = getGentraceBasePath();

    if (basePath.startsWith("http://localhost")) {
      webSocketUrl = "ws://localhost:3001";
    } else {
      // extract the domain from the base path
      try {
        const parsedUrl = new URL(basePath);
        if ((parsedUrl.protocol = "https:")) {
          webSocketUrl = "wss://";
        } else {
          webSocketUrl = "ws://";
        }
        webSocketUrl = webSocketUrl + parsedUrl.hostname + "/ws";
      } catch (error) {
        console.error("Invalid URL:", error);
        return "";
      }
    }

    return webSocketUrl;
  }

  // format customObjects for sending to WebSocket server
  private formatSetupTypes(customObjects: CustomObject[]): object {
    // create a Map to group customObjects by its typeName
    const groupedByMap = customObjects.reduce((acc, item) => {
      if (!acc.has(item.typeName)) {
        acc.set(item.typeName, []); // initialize the group as needed
      }

      // add the objectName to its typeName group
      acc.get(item.typeName)?.push(item.objectName);

      return acc;
    }, new Map<string, string[]>());

    // convert the Map to a formatted array and return it
    let formattedArray: Object[] = [];

    for (const [typeName, objectNames] of groupedByMap) {
      formattedArray.push({
        name: typeName,
        objects: objectNames,
      });
    }

    return formattedArray;
  }

  private isJson(message: string): boolean {
    try {
      JSON.parse(message);
    } catch (e) {
      return false;
    }
    return true;
  }

  private mapInputsToObjects(jsonInputs: any, inputFields: any): object {
    // map inputs to the registered custom objects

    try {
      let jsonOutputs = jsonInputs; // clone the structure

      for (const key in jsonInputs) {
        const value = jsonInputs[key];
        for (const customObject of this.registeredCustomObjects) {
          if (
            customObject.objectName == value &&
            customObject.typeName == inputFields[key]
          ) {
            jsonOutputs[key] = customObject.object;
          }
        }
      }

      return jsonOutputs;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private addOutputsToSteps(steps: any): any {
    for (const step of steps) {
      if (step.id && this.submittedStepOutputs.has(step.id)) {
        step.output = this.submittedStepOutputs.get(step.id);
      }
    }
    return steps;
  }

  // send registered objects to the WebSocket server to receive a playground URL
  // and listen for messages from the server to run an interaction

  public start(): void {
    const setupEvent = {
      id: uuidv4(),
      init: "pg-sdk",
      data: {
        type: "setup",
        apiKey: getGentraceApiKey(),
        interactions: this.registeredInteractionObjects,
        types: this.formatSetupTypes(this.registeredCustomObjects),
      },
    };

    const wsUrl = this.getWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      console.log("Connected to the WebSocket server at " + wsUrl);
      console.log("-> Sending event of type " + setupEvent.data.type);
      console.log(setupEvent);

      ws.send(JSON.stringify(setupEvent));

      // send ping to keep server connection open for longer
      setInterval(() => {
        console.log("-> ping");
        ws.send(JSON.stringify({ id: uuidv4(), ping: true }));
      }, 10000);
    });

    ws.addEventListener("message", async (event) => {
      const message = event.data.toString();
      console.log("<-", message);

      if (this.isJson(message)) {
        const received = JSON.parse(message);
        const receivedEventType = received.data.type;

        if (receivedEventType) {
          console.log("Received event type: " + receivedEventType);
        }

        if (receivedEventType == "setupResponse") {
          // receive event to display playground URL
          console.log("Received Playground URL: " + received.data.url);
        } else if (receivedEventType == "run") {
          for (const interactionObject of this.registeredInteractionObjects) {
            if (received.data.interaction == interactionObject.name) {
              console.log("Running interaction: " + interactionObject.name);

              // run the interaction function and store the related run info
              asyncLocalStorage.run(new Map(), async () => {
                const store = asyncLocalStorage.getStore() as any;

                store.set("id", received.data.id); // interaction run ID
                store.set("stepOverrides", received.data.stepOverrides);

                console.log("received.data.id: " + received.data.id);

                const runInputObjects = this.mapInputsToObjects(
                  received.data.inputs,
                  interactionObject.inputFields,
                );

                const runOutput =
                  await interactionObject.interaction(runInputObjects);

                // create a new runResponse event

                const stepsAndOutputs = this.addOutputsToSteps(
                  store.get("stepsArray"),
                );

                const runResponseEvent = {
                  id: uuidv4(),
                  for: received.from,
                  data: {
                    type: "runResponse",
                    id: store.get("id"), // this is the ID for the run
                    outputs: runOutput,
                    steps: stepsAndOutputs, // combines data from getStepInfo and submitOutput
                  },
                };

                console.log(
                  "-> Sending event of type " + runResponseEvent.data.type,
                );
                console.log(runResponseEvent);
                console.log(JSON.stringify(runResponseEvent));

                ws.send(JSON.stringify(runResponseEvent));
              });
            }
          }
        }
      }
    });

    ws.addEventListener("error", (e) => {
      console.error("error", e);
    });

    ws.addEventListener("close", () => {
      console.error("close");
    });
  }

  public registerCustomType(typeName: string) {
    this.registeredCustomTypes.push(typeName);
    return { output: typeName };
  }

  public registerCustomObject(
    typeName: string,
    objectName: string,
    object: object,
  ) {
    const customObject = {
      typeName: typeName,
      objectName: objectName,
      object: object,
    };
    this.registeredCustomObjects.push(customObject);
  }

  public registerInteraction(
    name: string,
    inputFields: TInput,
    outputFields: TOutput,
    interaction: (inputs: { [K in keyof TInput]?: any }) => {
      [K in keyof TOutput]?: any;
    },
  ) {
    const interactionObject = {
      name: name,
      inputFields: inputFields,
      outputFields: outputFields,
      interaction: interaction,
    };
    this.registeredInteractionObjects.push(interactionObject);
  }

  private getCachedInputString(
    inputArgs: Record<string, any>,
    interpolationVariables?: Record<string, any>,
  ): string {
    // deterministic combo of inputArgs and interpolationVariables
    return stringify({
      inputs: inputArgs,
      interpolation: interpolationVariables,
    });
  }

  public getStepRun<T extends Record<string, any> = Record<string, any>>(
    stepName: string,
    method: string,
    argsTemplate: T,
    templateData?: Record<string, any>,
  ): { overrideArgsTemplate: T; stepRunId: string; cachedResponse?: string } {
    const store = asyncLocalStorage.getStore() as any;

    const stepOverrides = store.get("stepOverrides");

    console.log("stepOverrides: ");
    console.log(stepOverrides);

    let newArgsTemplate = argsTemplate;

    for (const stepOverride of stepOverrides) {
      if (stepOverride.name == stepName) {
        Object.assign(newArgsTemplate, stepOverride.overrides);
      }
    }

    // storing steps for a future RunResponse to the WebSocket server

    if (store.get("stepsArray") == undefined) {
      store.set("stepsArray", []);
    }

    const stepId = uuidv4();
    store.get("stepsArray").push({
      id: stepId,
      name: stepName,
      method: method,
      inputs: newArgsTemplate,
      interpolation: templateData,
    });

    const cachedInputString = this.getCachedInputString(
      newArgsTemplate,
      templateData,
    );

    cachedStepInputs.set(stepId, cachedInputString);

    let cachedOutput: string = null;
    if (cachedStepOutputs.has(cachedInputString)) {
      cachedOutput = cachedStepOutputs.get(cachedInputString);
    }

    return {
      overrideArgsTemplate: newArgsTemplate,
      stepRunId: stepId,
      cachedResponse: cachedOutput,
    };
  }

  private isOutputValid(output: string): boolean {
    return output.trim().length > 0;
  }

  public submitStepRun(stepRunId: string, response: string) {
    this.submittedStepOutputs.set(stepRunId, response);

    if (cachedStepInputs.has(stepRunId) && this.isOutputValid(response)) {
      const cachedInputString = cachedStepInputs.get(stepRunId);
      cachedStepOutputs.set(cachedInputString, response);
    }
  }
}
