import { Context } from "./context";
import acorn from "acorn";

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

function getSingleParamName(param: acorn.Pattern, index: number) {
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
    const result = acorn.parse(`(${func.toString()})`, {
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
    const result = acorn.parse(func.toString(), {
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
