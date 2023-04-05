import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../configuration";
import { PipelineRun } from "./pipeline-run";

type PineconeConfiguration = {
  apiKey: string;
  environment: string;
  indexName?: string;
};

export class Pipeline {
  public id: string;
  public pineconeConfig: PineconeConfiguration;
  public openAIConfig: OpenAIConfiguration;
  public config: GentraceConfiguration;

  public pipelineHandlers: Map<string, any> = new Map();

  constructor({
    id,
    apiKey,
    basePath,
    openAIConfig,
    pineconeConfig,
  }: {
    id: string;
    apiKey: string;
    basePath?: string;
    openAIConfig?: OpenAIConfiguration;
    pineconeConfig?: PineconeConfiguration;
  }) {
    this.id = id;
    this.config = new GentraceConfiguration({
      apiKey,
      basePath,
    });

    this.openAIConfig = openAIConfig;
    this.pineconeConfig = pineconeConfig;
  }

  async setup() {
    if (this.pineconeConfig) {
      try {
        const { PineconePipelineHandler } = await import(
          "./vectorstores/pinecone"
        );
        const pineconeHandler = new PineconePipelineHandler({
          pipeline: this,
        });
        await pineconeHandler.init();
        this.pipelineHandlers.set("pinecone", pineconeHandler);
      } catch (e) {
        throw new Error(
          "Please install Pinecone as a dependency with, e.g. `yarn add @pinecone-database/pinecone`"
        );
      }
    }

    if (this.openAIConfig) {
      try {
        const { OpenAIPipelineHandler } = await import("./llms/openai");
        const openAIHandler = new OpenAIPipelineHandler({
          pipeline: this,
        });
        this.pipelineHandlers.set("openai", openAIHandler);
      } catch (e) {
        throw new Error(
          "Please install OpenAI as a dependency with, e.g. `yarn add openai`"
        );
      }
    }
  }

  start() {
    return new PipelineRun({ pipeline: this });
  }
}
