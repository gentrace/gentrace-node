import { getGentraceApiKey } from "@gentrace/core";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

export { init } from "@gentrace/core"; // for accessing the Gentrace API key

import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();

interface customObject {
  typeName: string;
  objectName: string;
  object: object;
}

interface interactionObject {
  name: string;
  inputFields: object;
  outputFields: object;
  interaction: any;
}

interface stepInputObject {
  provider: {
    type: string;
    default: string;
  };
  prompt: {
    type: string;
    default: string;
  };
}

export class GentraceSession {
  registeredCustomTypes: string[] = [];
  registeredCustomObjects: customObject[] = [];
  registeredInteractionObjects: interactionObject[] = [];

  //WEBSOCKET_URL = "ws://localhost:8080";
  WEBSOCKET_URL = "ws://localhost:3001";

  // format customObjects for sending to WebSocket server
  private formatSetupTypes(customObjects: customObject[]): object {
    // create a Map to group customObjects by its typeName
    const groupedByMap = customObjects.reduce((acc, item) => {
      // check if the typeName already exists in the accumulator
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
    console.log("GENTRACE_API_KEY: " + getGentraceApiKey());

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

    const ws = new WebSocket(this.WEBSOCKET_URL);

    ws.addEventListener("open", () => {
      console.log("Connected to the WebSocket server at " + this.WEBSOCKET_URL);
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

                // collect data stored within getStepInfo function
                const stepsArray = [
                  {
                    name: store.get("stepName"),
                    inputs: store.get("stepInputs"),
                  },
                ];

                // create a new runResponse event
                const runResponseEvent = {
                  id: uuidv4(),
                  for: received.from,
                  data: {
                    type: "runResponse",
                    id: store.get("id"), // this is the ID for the run
                    outputs: runOutput,
                    steps: stepsArray,
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
    //console.log("registeredCustomTypes: " + this.registeredCustomTypes);
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
    /*
    console.log(
      "registeredCustomObjects: " + JSON.stringify(this.registeredCustomObjects)
    );
    */
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
    /*
    console.log(
      "registeredCustomObjects: " + JSON.stringify(this.registeredCustomObjects)
    );
    */
  }

  public getStepInfo(
    stepName: string,
    defaultStepInput: stepInputObject,
  ): object {
    console.log("getStepInfo called");

    const store = asyncLocalStorage.getStore() as any;

    const id = store.get("id");
    const stepOverrides = store.get("stepOverrides");

    console.log("id: " + id);
    console.log("defaultStepInput: " + JSON.stringify(defaultStepInput));
    console.log("stepOverrides: " + JSON.stringify(stepOverrides));

    // use a matching stepOverride (or fall back to the defaultStepInput parameters)

    let newInputArgs: stepInputObject = defaultStepInput;
    for (const stepInput of stepOverrides) {
      if (stepInput.name == stepName) {
        if (stepInput.overrides.provider) {
          newInputArgs.provider.default = stepInput.overrides.provider;
        }

        if (stepInput.overrides.prompt) {
          newInputArgs.prompt.default = stepInput.overrides.prompt;
        }
      }
    }

    //console.log("newInputArgs: " + JSON.stringify(newInputArgs));

    // store the step inputs used back in asyncLocalStorage
    store.set("stepName", stepName);
    store.set("stepInputs", newInputArgs);

    return {
      newArgs: newInputArgs,
      id: id,
    };
  }
}
