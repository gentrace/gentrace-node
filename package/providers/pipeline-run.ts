import { IngestionApi } from "../api";
import { Pipeline } from "./pipeline";
import { PipelineRunResponse } from "../index";
import { v4 } from "uuid";
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

  public async submit(
    { waitForServer }: { waitForServer: boolean } = { waitForServer: false }
  ) {
    const ingestionApi = new IngestionApi(this.pipeline.config);

    const newPipelineRunId = v4();

    const submission = ingestionApi.pipelineRunPost({
      id: newPipelineRunId,
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

    if (!waitForServer) {
      const data: PipelineRunResponse = {
        pipelineRunId: newPipelineRunId,
      };
      return data;
    }

    const pipelinePostResponse = await submission;
    return pipelinePostResponse.data;
  }
}
