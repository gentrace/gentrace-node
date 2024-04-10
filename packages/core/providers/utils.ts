import { Context } from "./context";
import { Pattern, parse } from "acorn";
import axios from "axios";

export type GentraceParams = {
  pipelineSlug?: string;
  gentrace?: Context;
};

export type OptionalPipelineInfo = {
  pipelineId?: string;
  pipelineSlug?: string;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSingleParamName(param: Pattern, index: number) {
  if (param.type === "Identifier") {
    return param.name;
  } else if (
    param.type === "AssignmentPattern" &&
    param.left.type === "Identifier"
  ) {
    return param.left.name;
  } else {
    // If the parameter is a destructured object/array, we can't get the name
    return `param${index}`;
  }
}

function getParamNamesAnonymousFunction<F extends (...args: any[]) => any>(
  func: F,
) {
  let inputs: string[] = [];
  try {
    const result = parse(`(${func.toString()})`, {
      ecmaVersion: 2020,
    });

    const firstElement = result.body[0];
    if (!firstElement) {
      return inputs;
    }

    if (firstElement.type === "ExpressionStatement") {
      const expression = firstElement.expression;
      if (expression.type === "FunctionExpression") {
        inputs = expression.params.map(getSingleParamName);
      }
    }
  } catch (e) {
    // Do nothing
  }

  return inputs;
}

export function getParamNames<F extends (...args: any[]) => any>(func: F) {
  let inputs: string[] = [];
  try {
    const result = parse(func.toString(), {
      ecmaVersion: 2020,
    });

    const functionNode = result.body[0];
    if (!functionNode) {
      return inputs;
    }

    if (functionNode.type === "FunctionDeclaration") {
      inputs = functionNode.params.map(getSingleParamName);
    } else if (functionNode.type === "ExpressionStatement") {
      const expression = functionNode.expression;
      if (expression.type === "ArrowFunctionExpression") {
        inputs = expression.params.map(getSingleParamName);
      }
    }
  } catch (e) {
    // There's a chance that the passed function is a regular anonymous function (which is un-parseable by acorn)
    return getParamNamesAnonymousFunction(func);
  }

  return inputs;
}

export function zip<S1, S2>(
  firstCollection: Array<S1>,
  lastCollection: Array<S2>,
): Array<[S1, S2]> {
  const length = Math.min(firstCollection.length, lastCollection.length);
  const zipped: Array<[S1, S2]> = [];

  for (let index = 0; index < length; index++) {
    zipped.push([firstCollection[index], lastCollection[index]]);
  }

  return zipped;
}

let TEST_COUNTER = 0;

export function getTestCounter() {
  return TEST_COUNTER;
}

export function incrementTestCounter() {
  TEST_COUNTER += 1;
  return TEST_COUNTER;
}

export function decrementTestCounter() {
  TEST_COUNTER -= 1;
  return TEST_COUNTER;
}

export function getProcessEnv(name: string) {
  if (typeof process === "undefined") {
    return null;
  }

  return process.env[name];
}

export function safeJsonParse(jsonString: string | null) {
  try {
    return JSON.parse(jsonString ?? "");
  } catch (error) {
    return null;
  }
}

let lastErrorCheckpoint = Date.now(); // used for error throttling
let errorSent = false; // make sure first error is always shown

export function setErrorInterceptor(showErrorsInput: string) {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const showErrors = showErrorsInput.toLowerCase();

      if (showErrors === "none") {
        return Promise.reject("");
      }

      // make the error message more user friendly
      const now = Date.now();
      let friendlyMessage = new Date(now).toUTCString(); // timestamp

      if (error.config.url) {
        friendlyMessage += "\nGentrace URL: " + error.config.url;
      }
      if (error.message === "Network Error") {
        friendlyMessage +=
          "\nA network error occurred. Please check your connection.";
      } else if (error.message) {
        friendlyMessage += "\nError message: " + error.message;
      }

      if (error.code === "ECONNABORTED") {
        friendlyMessage += "\nThe request timed out. Please try again later.";
      } else if (error.code) {
        friendlyMessage += "\nError code: " + error.code;
      }
      if (error.status) {
        friendlyMessage += "\nError status: " + error.status;
      }

      if (showErrors === "all") {
        return Promise.reject(friendlyMessage);
      }

      // default path: show errors at most every 10 seconds
      // (errors that occur in between are throttled)

      if (errorSent === false || now - lastErrorCheckpoint > 10000) {
        console.error(error);
        errorSent = true;
        lastErrorCheckpoint = now;

        return Promise.reject(friendlyMessage);
      } else {
        return Promise.reject(""); // throttled error
      }
    },
  );
}
