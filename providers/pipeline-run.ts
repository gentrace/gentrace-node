import { GentraceApi } from "../api";
import { Configuration as GentraceConfiguration } from "../configuration";
import { Pipeline } from "./pipeline";
import { StepRun } from "./step-run";

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
    try {
      const { OpenAIHandler } = await import("./llms/openai");
      return new OpenAIHandler({
        pipeline: this.pipeline,
        pipelineRun: this,
      });
    } catch (e) {
      throw new Error(
        "Please install OpenAI as a dependency with, e.g. `yarn add openai`"
      );
    }
  }

  async getPinecone() {
    try {
      const { PineconeHandler } = await import("./vectorstores/pinecone");
      return new PineconeHandler({
        pipeline: this.pipeline,
        pipelineRun: this,
      });
    } catch (e) {
      throw new Error(
        "Please install Pinecone as a dependency with, e.g. `yarn add @pinecone-database/pinecone`"
      );
    }
  }

  async addStepRun(stepRun: StepRun) {
    this.stepRuns.push(stepRun);
  }

  public async submit() {
    const gentraceApi = new GentraceApi(this.pipeline.config);

    await gentraceApi.pipelineRunPost({
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
