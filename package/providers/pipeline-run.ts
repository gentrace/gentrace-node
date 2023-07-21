import { CoreApi } from "../api/core-api";
import { Pipeline } from "./pipeline";
import { PipelineRunResponse } from "../models/pipeline-run-response";
import { v4 } from "uuid";
import { PartialStepRunType, StepRun, StepRunType } from "./step-run";
import type { PineconePipelineHandler } from "./vectorstores/pinecone";
import type { OpenAIPipelineHandler } from "./llms/openai";
import { performance } from "perf_hooks";

export class PipelineRun {
  private pipeline: Pipeline;
  public stepRuns: StepRun[];

  constructor({ pipeline }: { pipeline: Pipeline }) {
    this.pipeline = pipeline;
    this.stepRuns = [];
  }

  getPipeline() {
    return this.pipeline;
  }

  async getOpenAI() {
    if (this.pipeline.pipelineHandlers.has("openai")) {
      const handler = this.pipeline.pipelineHandlers.get("openai");
      const clonedHandler: OpenAIPipelineHandler = Object.assign(
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
      const clonedHandler: PineconePipelineHandler = Object.assign(
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
          step.outputs
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
          step.outputs
        )
      );
    }
  }

  async measure<F extends (...args: any[]) => any>(
    func: F,
    inputs: Parameters<F>,
    stepInfo?: Omit<PartialStepRunType, "inputs" | "outputs">
  ): Promise<ReturnType<F>> {
    const startTime = performance.timeOrigin + performance.now();
    const returnValue = await func(...inputs);

    // Our server only accepts outputs as an object.
    let modifiedOuput = returnValue;
    if (typeof returnValue !== "object") {
      modifiedOuput = { value: returnValue };
    }
    const endTime = performance.timeOrigin + performance.now();
    const elapsedTime = Math.floor(endTime - startTime);

    this.stepRuns.push(
      new StepRun(
        stepInfo.provider ?? "undeclared",
        stepInfo.invocation ?? "undeclared",
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        inputs,
        stepInfo.modelParams ?? {},
        modifiedOuput
      )
    );

    return returnValue;
  }

  public async submit(
    { waitForServer }: { waitForServer: boolean } = { waitForServer: false }
  ) {
    const coreApi = new CoreApi(this.pipeline.config);

    const newPipelineRunId = v4();

    this.pipeline.logInfo("Submitting PipelineRun to Gentrace");

    const submission = coreApi.runPost({
      id: newPipelineRunId,
      slug: this.pipeline.slug,
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

      const data: PipelineRunResponse = {
        pipelineRunId: newPipelineRunId,
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
