import { GentraceApi } from "../api";
import { Pipeline } from "./pipeline";
import { StepRun } from "./step-run";
import type { PineconePipelineHandler } from "./vectorstores/pinecone";
import type { OpenAIPipelineHandler } from "./llms/openai";

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

  async addStepRun(stepRun: StepRun) {
    this.stepRuns.push(stepRun);
  }

  public async submit() {
    const gentraceApi = new GentraceApi(this.pipeline.config);

    return await gentraceApi.pipelineRunPost({
      name: this.pipeline.id,
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
  }
}
