import { v4 } from "uuid";
import { V1Api } from "../api/v1-api";
import { Configuration } from "../configuration";
import { RunRequestCollectionMethodEnum } from "../models/run-request";
import { RunResponse } from "../models/run-response";
import { Context, CoreStepRunContext } from "./context";
import { StepRun, PartialStepRunType } from "./step-run";
import { getParamNames, getTestCounter, safeJsonParse, zip } from "./utils";
import {
  globalGentraceConfig,
  globalRequestBuffer,
  globalGentraceApiV2,
} from "./init";
import _ from "lodash";

type PRStepRunType = Omit<PartialStepRunType, "context"> & {
  context?: CoreStepRunContext;
};

interface PipelineLike {
  slug: string;
  config: Configuration;
  logInfo: (message: string) => void;
  logWarn: (message: string | Error) => void;
}

type PipelineRunPayload = {
  id: string;
  slug: string;
  metadata: {};
  previousRunId: string;
  collectionMethod: "runner";
  stepRuns: StepRun[];
};

type SelectStepRun = Pick<
  StepRun,
  "inputs" | "outputs" | "modelParams" | "context"
>;

type StepRunWhitelistDescriptor = Partial<{
  [k in keyof SelectStepRun]:
    | boolean
    | string[]
    | (string[] | string)[]
    | string;
}>;

export const getRun = async (id: string) => {
  if (!globalGentraceApiV2) {
    throw new Error("Gentrace API key not initialized. Call init() first.");
  }

  const response = await globalGentraceApiV2.v2RunsIdGet(id);
  const run = response.data;
  return run;
};

export class PipelineRun {
  private pipeline: PipelineLike;
  public stepRuns: StepRun[];

  public context?: Context;

  private id: string = v4();

  private instantiationTime: string = new Date().toISOString();

  constructor({
    pipeline,
    context,
  }: {
    pipeline: PipelineLike;
    context?: Context;
  }) {
    this.pipeline = pipeline;
    this.stepRuns = [];
    this.context = context;
  }

  getPipeline() {
    return this.pipeline;
  }

  getId() {
    return this.id;
  }

  getContext() {
    return this.context;
  }

  updateContext(updatedContext: Partial<Context>) {
    this.context = { ...this.context, ...updatedContext };
    return this.context;
  }

  async addStepRunNode(stepRun: StepRun) {
    this.stepRuns.push(stepRun);
  }

  /**
   * Creates a checkpoint by recording a `StepRun` instance with execution metadata and pushes it to `this.stepRuns`.
   * If no prior `StepRun` instances exist, the elapsed time is set to 0 and the start and end times are set to the
   * current timestamp. If it is empty, elapsed time is set to 0 and start time and end time are set to the current
   * timestamp.
   *
   * @param {PRStepRunType & { inputs: any; outputs: any; }} step The information about the step to checkpoint.
   * This includes the inputs and outputs of the step, as well as optional provider, invocation and modelParams metadata.
   *
   * @example
   * const stepInfo = {
   *   providerName: 'MyProvider',
   *   invocation: 'doSomething',
   *   inputs: { x: 10, y: 20 },
   *   outputs: { result: 30 }
   * };
   * checkpoint(stepInfo);
   *
   * @returns {void} The function does not return anything.
   *
   * @throws {Error} If the `StepRun` constructor or any other operations throw an error, it will be propagated.
   */
  checkpoint(
    step: PRStepRunType & {
      inputs: any;
      outputs: any;
    },
  ) {
    const lastElement: StepRun | undefined =
      this.stepRuns[this.stepRuns.length - 1];

    if (lastElement) {
      const { endTime: stepStartTime } = lastElement;
      const elapsedTime =
        new Date().getTime() - new Date(stepStartTime).getTime();
      const endTimeNew = new Date().toISOString();
      this.stepRuns.push(
        new StepRun(
          step.providerName ?? "undeclared",
          step.invocation ?? "undeclared",
          elapsedTime,
          stepStartTime,
          endTimeNew,
          step.inputs,
          step.modelParams ?? {},
          step.outputs,
          step.context ?? {},
        ),
      );
    } else {
      const endTime = new Date().toISOString();

      const elapsedTime =
        new Date(endTime).getTime() -
        new Date(this.instantiationTime).getTime();

      this.stepRuns.push(
        new StepRun(
          step.providerName ?? "undeclared",
          step.invocation ?? "undeclared",
          elapsedTime,
          this.instantiationTime,
          endTime,
          step.inputs,
          step.modelParams ?? {},
          step.outputs,
          step.context ?? {},
        ),
      );
    }
  }

  /**
   * Asynchronously measures the execution time of a function.
   *
   * @template F Function type that extends (...args: any[]) => any
   * @param {F} func The function to be measured.
   * @param {Parameters<F>} inputs The parameters to be passed to the function.
   * @param {Omit<PRStepRunType, "inputs" | "outputs">} [stepInfo] Optional metadata for the function execution.
   * @returns {Promise<ReturnType<F>>} Returns a promise that resolves to the return type of the function.
   *
   * @example
   * async function foo(n: number) {
   *   return n * 2;
   * }
   * const result = await measure(foo, [2]); // result will be 4
   *
   * The function also records a `StepRun` instance with execution metadata and pushes it to `this.stepRuns`.
   * The recorded `StepRun` includes information such as the elapsed time, start and end time,
   * resolved inputs, and model parameters if provided.
   */
  async measure<F extends (...args: any[]) => any>(
    func: F,
    inputs: Parameters<F>,
    stepInfo?: Omit<PRStepRunType, "inputs" | "outputs">,
  ): Promise<ReturnType<F>> {
    const startTime = Date.now();
    const returnValue = await func(...inputs);
    const paramNames = getParamNames(func);

    const resolvedInputs = zip(paramNames, inputs).reduce<{
      [key: string]: any;
    }>((acc, current) => {
      const [key, value] = current;
      acc[key] = value;
      return acc;
    }, {});

    // Our server only accepts outputs as an object.
    let modifiedOutput = returnValue;
    if (typeof returnValue !== "object") {
      modifiedOutput = { value: returnValue };
    }
    const endTime = Date.now();
    const elapsedTime = Math.floor(endTime - startTime);

    this.stepRuns.push(
      new StepRun(
        stepInfo?.providerName ?? "undeclared",
        stepInfo?.invocation ?? "undeclared",
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        resolvedInputs,
        stepInfo?.modelParams ?? {},
        modifiedOutput,
        stepInfo?.context ?? {},
      ),
    );

    return returnValue;
  }

  public toObject(): PipelineRunPayload {
    let mergedMetadata = {};

    const updatedStepRuns = this.stepRuns.map(
      ({
        providerName: providerName,
        elapsedTime,
        startTime,
        endTime,
        invocation,
        modelParams,
        inputs,
        outputs,
        context: stepRunContext,
      }) => {
        let {
          metadata: thisContextMetadata,
          previousRunId: _prPreviousRunId,
          ...restThisContext
        } = this.context ?? {};

        let {
          metadata: stepRunContextMetadata,
          previousRunId: _srPreviousRunId,
          ...restStepRunContext
        } = stepRunContext ?? {};

        // Merge metadata
        mergedMetadata = {
          ...mergedMetadata,
          ...thisContextMetadata,
          ...stepRunContextMetadata,
        };

        return {
          providerName,
          elapsedTime,
          startTime,
          endTime,
          invocation,
          modelParams,
          inputs,
          outputs,
          context: {
            ...restThisContext,
            ...restStepRunContext,
          },
        };
      },
    );

    return {
      id: this.id,
      slug: this.pipeline.slug,
      metadata: mergedMetadata,
      previousRunId: this.context?.previousRunId,
      collectionMethod: RunRequestCollectionMethodEnum.Runner,
      stepRuns: updatedStepRuns,
    };
  }

  public toJson() {
    return JSON.stringify(this.toObject(), null, 2);
  }

  public static getRedactedRunFromJson(
    json: string | object,
    options?: {
      waitForServer?: boolean;
      pipeline?: PipelineLike;
      selectFields?:
        | StepRunWhitelistDescriptor
        | ((steps: StepRun[]) => StepRunWhitelistDescriptor[]);
    },
  ) {
    const selectFields = options?.selectFields;
    const pipeline = options?.pipeline;

    const pipelineRunObject = (
      typeof json === "string" ? safeJsonParse(json) : json
    ) as PipelineRunPayload | null;

    if (!pipelineRunObject) {
      return null;
    }

    function isSingleStepRunWhitelist(
      value:
        | StepRunWhitelistDescriptor
        | ((steps: StepRun[]) => StepRunWhitelistDescriptor[]),
    ): value is StepRunWhitelistDescriptor {
      return typeof value !== "function";
    }

    if (selectFields) {
      const stepRuns = pipelineRunObject.stepRuns;
      let selectedFields: StepRunWhitelistDescriptor[];

      if (!isSingleStepRunWhitelist(selectFields)) {
        selectedFields = selectFields(stepRuns);

        if (selectedFields.length !== stepRuns.length && pipeline) {
          pipeline.logWarn(
            "The selectFields function did not return the correct number of fields.",
          );
        }

        if (selectedFields.length < stepRuns.length && pipeline) {
          // Fill rest with the last element
          const last = selectedFields[selectedFields.length - 1];
          selectedFields = selectedFields.concat(
            Array.from({ length: stepRuns.length - selectedFields.length }).map(
              () => last,
            ),
          );
        }
      } else {
        selectedFields = Array.from({ length: stepRuns.length }).map(
          () => selectFields,
        );
      }

      pipelineRunObject.stepRuns = stepRuns.map((stepRun, index) => {
        const selectedFieldsForStep = selectedFields[index];
        const updatedStepRun = { ...stepRun };

        if (selectedFieldsForStep) {
          for (const [fieldKey, selector] of Object.entries(
            selectedFieldsForStep,
          )) {
            const fieldKeyTyped = fieldKey as keyof StepRun;
            const stepRunValue = updatedStepRun[fieldKeyTyped];
            if (!stepRunValue) {
              continue;
            }

            const fieldType = typeof stepRunValue;
            const isSelectorArray = Array.isArray(selector);
            const isSelectorString = typeof selector === "string";
            const isSelectorBoolean = typeof selector === "boolean";
            if (
              fieldType === "object" &&
              (isSelectorArray || isSelectorString)
            ) {
              const newValue: Record<string, any> = {};

              if (isSelectorString) {
                const whiteListValue = _.get(stepRunValue, selector);
                _.set(newValue, selector, whiteListValue);
              } else if (isSelectorArray) {
                for (const key of selector) {
                  const whiteListValue = _.get(stepRunValue, key);
                  _.set(newValue, key, whiteListValue);
                }
              }

              // @ts-ignore
              updatedStepRun[fieldKeyTyped] = newValue;
            } else if (fieldType === "object" && isSelectorBoolean) {
              if (!selector) {
                // @ts-ignore
                updatedStepRun[fieldKeyTyped] = {};
              }
            }
          }
        }

        return updatedStepRun;
      });
    }

    if (pipeline) {
      pipeline.logInfo("Submitting PipelineRun to Gentrace");
    }

    return pipelineRunObject;
  }

  public static async submitFromJson(
    json: string | object,
    options?: {
      waitForServer?: boolean;
      pipeline?: PipelineLike;
      selectFields?:
        | StepRunWhitelistDescriptor
        | ((steps: StepRun[]) => StepRunWhitelistDescriptor[]);
    },
  ) {
    const pipeline = options?.pipeline;
    const waitForServer = options?.waitForServer ?? false;

    const api = new V1Api(pipeline ? pipeline.config : globalGentraceConfig);

    const pipelineRunObject = PipelineRun.getRedactedRunFromJson(json, {
      waitForServer: false,
      pipeline,
      selectFields: options?.selectFields,
    });

    if (!pipelineRunObject) {
      if (pipeline) {
        pipeline.logWarn("Invalid JSON passed to submitFromJson");
      }
      return {};
    }

    const submission = api.v1RunPost(pipelineRunObject);

    if (!waitForServer) {
      globalRequestBuffer[pipelineRunObject.id] = submission;

      submission
        .catch((e) => {
          if (pipeline) {
            pipeline.logWarn(e);
          }
        })
        .then(() => {
          if (pipeline) {
            pipeline.logInfo("Successfully submitted PipelineRun to Gentrace");
          }
        })
        .finally(() => {
          delete globalRequestBuffer[pipelineRunObject.id];
        });

      const data: RunResponse = {
        pipelineRunId: pipelineRunObject.id,
      };
      return data;
    }

    try {
      const pipelinePostResponse = await submission;
      if (pipeline) {
        pipeline.logInfo("Successfully submitted PipelineRun to Gentrace");
      }
      return pipelinePostResponse.data;
    } catch (e) {
      if (pipeline) {
        pipeline.logWarn(e);
      }
      throw e;
    }
  }

  public async submit(
    {
      waitForServer,
      selectFields,
    }: {
      waitForServer?: boolean;
      selectFields?:
        | StepRunWhitelistDescriptor
        | ((steps: StepRun[]) => StepRunWhitelistDescriptor[]);
    } = { waitForServer: false },
  ) {
    const testCounter = getTestCounter();

    if (testCounter > 0) {
      const data: RunResponse = {
        pipelineRunId: this.id,
      };
      return data;
    }

    const pipelineRunObject = this.toObject();

    const response = await PipelineRun.submitFromJson(pipelineRunObject, {
      waitForServer,
      pipeline: this.pipeline,
      selectFields,
    });

    return response;
  }
}
