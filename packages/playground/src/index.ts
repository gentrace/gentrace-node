import { getGentraceApiKey } from "@gentrace/core";
import WebSocket from "ws";

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

export class GentraceSession {
  registeredCustomTypes: string[] = [];
  registeredCustomObjects: customObject[] = [];
  registeredInteractionObjects: interactionObject[] = [];

  WEBSOCKET_URL = "ws://localhost:8080";
  //WEBSOCKET_URL = "ws://localhost:3001"

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
      eventType: "setup",
      interactions: this.registeredInteractionObjects,
      types: this.formatSetupTypes(this.registeredCustomObjects),
    };

    const wsConnection = new WebSocket(this.WEBSOCKET_URL);

    wsConnection.onopen = () => {
      console.log("Connected to the WebSocket server at " + this.WEBSOCKET_URL);

      // Send the first messages to the WebSocket server

      wsConnection.send("Hello, WebSocket server!");
      wsConnection.send("Sending message of eventType " + setupEvent.eventType);

      wsConnection.send(JSON.stringify(setupEvent));
    };

    wsConnection.onerror = (error: any) => {
      console.error(`WebSocket error: ${error}`);
    };

    wsConnection.onmessage = (e: any) => {
      console.log(`WebSocket Server says: ${e.data}`);

      if (this.isJson(e.data)) {
        const received = JSON.parse(e.data);
        console.log("Received event type: " + received.eventType);

        if (received.eventType == "setupResponse") {
          // receive event to display playground URL
          console.log("start: playground URL to be displayed");
        } else if (received.eventType == "run") {
          for (const interationObject of this.registeredInteractionObjects) {
            if (received.interaction == interationObject.name) {
              // run the interaction function and store the related run info
              asyncLocalStorage.run(new Map(), () => {
                const store = asyncLocalStorage.getStore() as any;
                store.set("id", received.id);
                store.set("stepOverrides", received.stepOverrides);

                let output;
                if (received.inputs) {
                  // use inputs in the received message
                  output = interationObject.interaction(received.inputs);
                } else {
                  // use defaults in the interaction object
                  output = interationObject.interaction(
                    interationObject.inputFields,
                  );
                }

                // TODO: SDK needs to send runResponse
              });
            }
          }
        }
      }
    };
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

  public getStepInfo(stepName: string, stepInputs: object): object {
    console.log("getStepInfo called");

    const store = asyncLocalStorage.getStore() as any;

    console.log("id: " + store.get("id"));
    console.log("stepOverrides: " + JSON.stringify(store.get("stepOverrides")));

    // todo: use the stepOverrides (or use the default stepInputs parameter)

    return {
      new_args: "new_args_value",
      id: "id_value",
    };
  }
}
