import { v4 } from "uuid";
import { CoreApi } from "../api/core-api";
import { RunResponse } from "../models/run-response";
import { RunRequestCollectionMethodEnum } from "../models/run-request";
import type { OpenAIPipelineHandler } from "../handlers/llms/openai";
import { Pipeline } from "./pipeline";
import { PartialStepRunType, StepRun } from "./step-run";
import { getParamNames, getTestCounter, zip } from "./utils";
import type { PineconePipelineHandler } from "../handlers/vectorstores/pinecone";
import Context from "./context";
import { AdvancedOpenAIApi } from "./advanced/openai";
import { AdvancedPineconeClient } from "./advanced/pinecone";

export class PipelineRun {
  private pipeline: Pipeline;
  public stepRuns: StepRun[];

  private context?: Context;

  private id: string = v4();

  constructor({
    pipeline,
    context,
  }: {
    pipeline: Pipeline;
    context?: Context;
  }) {
    this.pipeline = pipeline;
    this.context = context;
    this.stepRuns = [];
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

  async getOpenAI() {
    if (this.pipeline.pipelineHandlers.has("openai")) {
      const handler = this.pipeline.pipelineHandlers.get("openai");
      const clonedHandler: AdvancedOpenAIApi = Object.assign(
        Object.create(Object.getPrototypeOf(handler)),
        handler
      );
      clonedHandler.setPipelineRun(this);
      return clonedHandler;
    } else {
      throw new Error(
        "Did not find OpenAI handler. Did you call setup() on the pipeline?"
      );
    }
  }

  async getPinecone() {
    if (this.pipeline.pipelineHandlers.has("pinecone")) {
      const handler = this.pipeline.pipelineHandlers.get("pinecone");
      const clonedHandler: AdvancedPineconeClient = Object.assign(
        Object.create(Object.getPrototypeOf(handler)),
        handler
      );
      clonedHandler.setPipelineRun(this);
      return clonedHandler;
    } else {
      throw new Error(
        "Did not find Pinecone handler. Did you call setup() on the pipeline?"
      );
    }
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
   * @param {PartialStepRunType & { inputs: any; outputs: any; }} step The information about the step to checkpoint.
   * This includes the inputs and outputs of the step, as well as optional provider, invocation and modelParams metadata.
   *
   * @example
   * const stepInfo = {
   *   provider: 'MyProvider',
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
    step: PartialStepRunType & {
      inputs: any;
      outputs: any;
    }
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
          step.provider ?? "undeclared",
          step.invocation ?? "undeclared",
          elapsedTime,
          stepStartTime,
          endTimeNew,
          step.inputs,
          step.modelParams ?? {},
          step.outputs,
          step.context ?? {}
        )
      );
    } else {
      const elapsedTime = 0;
      const startAndEndTime = new Date().toISOString();
      this.stepRuns.push(
        new StepRun(
          step.provider ?? "undeclared",
          step.invocation ?? "undeclared",
          elapsedTime,
          startAndEndTime,
          startAndEndTime,
          step.inputs,
          step.modelParams ?? {},
          step.outputs,
          step.context ?? {}
        )
      );
    }
  }

  /**
   * Asynchronously measures the execution time of a function.
   *
   * @template F Function type that extends (...args: any[]) => any
   * @param {F} func The function to be measured.
   * @param {Parameters<F>} inputs The parameters to be passed to the function.
   * @param {Omit<PartialStepRunType, "inputs" | "outputs">} [stepInfo] Optional metadata for the function execution.
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
    stepInfo?: Omit<PartialStepRunType, "inputs" | "outputs">
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
    let modifiedOuput = returnValue;
    if (typeof returnValue !== "object") {
      modifiedOuput = { value: returnValue };
    }
    const endTime = Date.now();
    const elapsedTime = Math.floor(endTime - startTime);

    this.stepRuns.push(
      new StepRun(
        stepInfo?.provider ?? "undeclared",
        stepInfo?.invocation ?? "undeclared",
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        resolvedInputs,
        stepInfo?.modelParams ?? {},
        modifiedOuput,
        stepInfo?.context ?? {}
      )
    );

    return returnValue;
  }

  public async submit(
    { waitForServer }: { waitForServer: boolean } = { waitForServer: false }
  ) {
    const testCounter = getTestCounter();

    if (testCounter > 0) {
      const data: RunResponse = {
        pipelineRunId: this.id,
      };
      return data;
    }

    const coreApi = new CoreApi(this.pipeline.config);

    this.pipeline.logInfo("Submitting PipelineRun to Gentrace");

    const submission = coreApi.runPost({
      id: this.id,
      // @deprecated: only use slug in future releases
      slug: this.pipeline.slug ?? this.pipeline.id,
      collectionMethod: RunRequestCollectionMethodEnum.Runner,
      stepRuns: this.stepRuns.map(
        ({
          provider,
          elapsedTime,
          startTime,
          endTime,
          invocation,
          modelParams,
          inputs,
          outputs,
          context: stepRunContext,
        }) => {
          return {
            provider: {
              name: provider,
              invocation,
              modelParams,
              inputs,
              outputs,
            },
            elapsedTime,
            startTime,
            endTime,
            context: {
              ...(this.context ?? {}),
              ...(stepRunContext ?? {}),
            },
          };
        }
      ),
    });

    if (!waitForServer) {
      submission
        .catch((e) => {
          this.pipeline.logWarn(e);
        })
        .then(() => {
          this.pipeline.logInfo(
            "Successfully submitted PipelineRun to Gentrace"
          );
        });

      const data: RunResponse = {
        pipelineRunId: this.id,
      };
      return data;
    }

    try {
      const pipelinePostResponse = await submission;
      this.pipeline.logInfo("Successfully submitted PipelineRun to Gentrace");
      return pipelinePostResponse.data;
    } catch (e) {
      this.pipeline.logWarn(e);
      throw e;
    }
  }
}
