import { Context, ResultContext } from "./context";
import { Pattern, parse } from "acorn";
import axios from "axios";
import { TestCase, TestCaseV2 } from "../models";
import { PipelineRun } from "./pipeline-run";
import { TestRun } from "./test-result";

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
export function getContextTestCaseFilter(
  contextOrCaseFilter?:
    | ResultContext
    | ((
        testCase: Omit<
          TestCase,
          "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
        >,
      ) => boolean),
  caseFilterOrUndefined?: (
    testCase: Omit<
      TestCase,
      "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
    >,
  ) => boolean,
): {
  context: ResultContext | undefined;
  caseFilter: (
    testCase: Omit<
      TestCase,
      "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"
    >,
  ) => boolean | undefined;
} {
  let context, caseFilter;
  // Determine the overload being used based on the types of arguments
  if (typeof contextOrCaseFilter === "function") {
    caseFilter = contextOrCaseFilter;
    context = undefined;
  } else {
    context = contextOrCaseFilter;
    caseFilter = caseFilterOrUndefined;
  }

  return { context, caseFilter };
}

let lastErrorCheckpoint = Date.now(); // used for error throttling
let errorSent = false; // make sure first error is always shown

export function setErrorInterceptor(showErrorsInput: string) {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      let showErrors = showErrorsInput;
      if (showErrorsInput) {
        showErrors = showErrorsInput.toLowerCase();
      }

      if (showErrors === "none") {
        return Promise.reject("");
      }

      if (showErrors === "all") {
        return Promise.reject(error);
      }

      // default path: make the error message more user friendly

      const now = Date.now();
      let friendlyMessage = new Date(now).toUTCString(); // timestamp

      if (error.config?.url) {
        friendlyMessage += "\nGentrace URL: " + error.config.url;
      }
      if (error.message === "Network Error") {
        friendlyMessage +=
          "\nA network error occurred. Please check your connection.";
      } else if (error.message) {
        friendlyMessage += "\nError message: " + error.message;
      }
      if (error.response?.data?.message) {
        friendlyMessage += "\n🛑 " + error.response.data.message;
      }
      if (error.response?.data?.errors) {
        friendlyMessage +=
          "\n🛑 Errors: " + JSON.stringify(error.response.data.errors, null, 2);
      }
      if (error.code === "ECONNABORTED") {
        friendlyMessage += "\nThe request timed out. Please try again later.";
      } else if (error.code) {
        friendlyMessage += "\nError code: " + error.code;
      }
      if (error.status) {
        friendlyMessage += "\nError status: " + error.status;
      }

      // show errors at most every 10 seconds
      // (errors that occur in between are throttled)

      if (errorSent === false || now - lastErrorCheckpoint > 10000) {
        errorSent = true;
        lastErrorCheckpoint = now;

        return Promise.reject(friendlyMessage);
      } else {
        return Promise.reject(""); // throttled error
      }
    },
  );
}

/**
 * Constructs step runs for a given test case and pipeline run.
 *
 * @param {TestCase | TestCaseV2} testCase - The test case object.
 * @param {PipelineRun} pipelineRun - The pipeline run object.
 * @returns {TestRun} The constructed test run object.
 */
export function constructStepRuns(
  testCase: TestCase | TestCaseV2,
  pipelineRun: PipelineRun,
): TestRun {
  let mergedMetadata = {};

  const updatedStepRuns = pipelineRun.stepRuns.map((stepRun) => {
    let {
      metadata: thisContextMetadata,
      previousRunId: _prPreviousRunId,
      ...restThisContext
    } = pipelineRun.context ?? {};

    let {
      metadata: stepRunContextMetadata,
      previousRunId: _srPreviousRunId,
      ...restStepRunContext
    } = stepRun.context ?? {};

    // Merge metadata
    mergedMetadata = {
      ...mergedMetadata,
      ...thisContextMetadata,
      ...stepRunContextMetadata,
    };

    return {
      modelParams: stepRun.modelParams,
      invocation: stepRun.invocation,
      inputs: stepRun.inputs,
      outputs: stepRun.outputs,
      providerName: stepRun.providerName,
      elapsedTime: stepRun.elapsedTime,
      startTime: stepRun.startTime,
      endTime: stepRun.endTime,
      context: { ...restThisContext, ...restStepRunContext },
    };
  });

  const testRun: TestRun = {
    caseId: testCase.id,
    metadata: mergedMetadata,
    stepRuns: updatedStepRuns,
  };

  if (pipelineRun.getId()) {
    testRun.id = pipelineRun.getId();
  }

  return testRun;
}
