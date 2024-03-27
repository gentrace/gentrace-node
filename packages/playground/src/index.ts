import { getGentraceApiKey, getGentraceBasePath } from "@gentrace/core";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

export { init } from "@gentrace/core"; // for accessing the Gentrace API key

import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();

type CustomObject = {
  typeName: string;
  objectName: string;
  object: object;
};

type InteractionObject = {
  name: string;
  inputFields: object;
  outputFields: object;
  interaction: any;
};

type StepInputObject = {
  provider: {
    type: string;
    default: string;
    value: string;
  };
  prompt: {
    type: string;
    default: string;
    value: string;
  };
};

export class GentraceSession {
  registeredCustomTypes: string[] = [];
  registeredCustomObjects: CustomObject[] = [];
  registeredInteractionObjects: InteractionObject[] = [];

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
    });

    ws.addEventListener("message", async (event) => {
      const message = event.data.toString();
      console.log("<-", message);

      if (this.isJson(message)) {
        const received = JSON.parse(message);
        const receivedEventType = received.data.type;

        console.log("Received event type: " + receivedEventType);

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

                let runOutput;
                if (received.data.inputs) {
                  // use inputs in the received message
                  runOutput = await interactionObject.interaction(
                    received.data.inputs,
                  );
                } else {
                  // use defaults in the interaction object
                  runOutput = await interactionObject.interaction(
                    interactionObject.inputFields,
                  );
                }

                // create a new runResponse event
                const runResponseEvent = {
                  id: uuidv4(),
                  for: received.from,
                  data: {
                    type: "runResponse",
                    id: store.get("id"), // this is the ID for the run
                    outputs: runOutput,
                    steps: store.get("stepsArray"), // this is set in the getStepInfo function
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
    inputFields: object,
    outputFields: object,
    interaction: any,
  ) {
    const interactionObject = {
      name: name,
      inputFields: inputFields,
      outputFields: outputFields,
      interaction: interaction,
    };
    this.registeredInteractionObjects.push(interactionObject);
  }

  public getStepInfo(
    stepName: string,
    defaultStepInputs: StepInputObject,
  ): object {
    const store = asyncLocalStorage.getStore() as any;

    // getting stored parameters for usage in this function
    const id = store.get("id");
    const stepOverrides = store.get("stepOverrides");

    // use a matching stepOverride (or fall back to the defaultStepInputs parameters)

    let newInputArgs = {
      provider: defaultStepInputs.provider.default,
      prompt: defaultStepInputs.prompt.default,
    }; // initialize to the defaults

    let newStepInputs = defaultStepInputs; // to be sent as a future RunResponse

    for (const stepInputs of stepOverrides) {
      if (stepInputs.name == stepName) {
        if (stepInputs.overrides.provider) {
          newInputArgs.provider = stepInputs.overrides.provider;
          newStepInputs.provider.value = stepInputs.overrides.provider;
        }

        if (stepInputs.overrides.prompt) {
          newInputArgs.prompt = stepInputs.overrides.prompt;
          newStepInputs.prompt.value = stepInputs.overrides.prompt;
        }
      }
    }

    //console.log("stepInputs: " + JSON.stringify(newStepInputs));
    //console.log("newInputArgs: " + JSON.stringify(newInputArgs));

    // storing steps for a future RunResponse to the WebSocket server
    if (store.get("stepsArray") == undefined) {
      // store the first step
      store.set("stepsArray", [
        {
          name: stepName,
          inputs: newStepInputs,
        },
      ]);
    } else {
      // these are subsequent steps
      // set prompt as output from the previous step (which is in the default)
      /*
      newStepInputs.prompt.default = defaultStepInputs.prompt.default;
      newStepInputs.prompt.value = defaultStepInputs.prompt.default;

      store.get("stepsArray").push({
        name: stepName,
        inputs: newStepInputs,
      });
      */
    }

    return {
      newArgs: newInputArgs,
      id: id,
    };
  }
}
