import { Context, ResultContext } from "./context";
import { Pattern, parse } from "acorn";
import axios from "axios";
import { TestCase, TestCaseV2 } from "../models";
import { PipelineRun } from "./pipeline-run";
import { TestCaseForSubmission, TestRun } from "./test-result";

export type GentraceParams = {
  pipelineSlug?: string;
  gentrace?: Context;
};

export type OptionalPipelineInfo = {
  pipelineId?: string;
  pipelineSlug?: string;
};

export type LocalTestData = {
  name: string;
  inputs: Record<string, any>;
  expectedOutputs?: Record<string, any>;
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

interface ExtendedError extends Error {
  details?: any;
  isInterceptorError?: boolean;
}

export function setErrorInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Guard against recursive error handling
      if ((error as ExtendedError).isInterceptorError) {
        return Promise.reject(error);
      }

      const simplified = {
        status: error.response?.status,
        method: error.config?.method?.toUpperCase(),
        requestUrl: error.config?.url,
        requestData: error.config?.data,
        responseData: error.response?.data,
        message: error.response?.data?.message,
      };
      const newError = new Error(
        (simplified.message || "Request failed") +
          ": " +
          JSON.stringify(simplified, null, 2),
      ) as ExtendedError;
      newError.details = simplified;
      newError.isInterceptorError = true; // Mark as already processed

      return Promise.reject(newError);
    },
  );
}

/**
 * Constructs step runs for a given test case and pipeline run.
 *
 * @param {TestCase | TestCaseV2 | LocalTestData} testCase - The test case object.
 * @param {PipelineRun} pipelineRun - The pipeline run object.
 * @returns {TestRun} The constructed test run object.
 */
export function constructStepRuns(
  testCase: {
    id?: string | undefined;
    name?: string | undefined;
    inputs?: Record<string, any> | undefined;
  },
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
      error: stepRun.error,
    };
  });

  const testRun: TestRun = {
    caseId: testCase.id ?? undefined,
    metadata: mergedMetadata,
    stepRuns: updatedStepRuns,
    evaluations: pipelineRun.getLocalEvaluations(),
    error: pipelineRun.getError(),
  };

  if (testCase.name) {
    testRun.name = testCase.name;
  }

  if (testCase.inputs) {
    testRun.inputs = testCase.inputs;
    // testRun.expectedOutputs = testCase.expectedOutputs;
  }

  if (pipelineRun.getId()) {
    testRun.id = pipelineRun.getId();
  }

  return testRun;
}

/**
 * Type guard to check if the test case is either TestCase or TestCaseV2
 * @param testCase - The test case to check
 * @returns True if the test case is TestCase or TestCaseV2, false if it's LocalTestData
 */
export function isTestCaseOrTestCaseV2(
  testCase: TestCaseForSubmission,
): testCase is TestCase | TestCaseV2 {
  return (
    "id" in testCase && "pipelineId" in testCase && "datasetId" in testCase
  );
}
