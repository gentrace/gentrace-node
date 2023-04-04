import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../configuration";
import { PipelineRun } from "./pipeline-run";

type PineconeConfiguration = {
  apiKey: string;
  environment: string;
};

export class Pipeline {
  public id: string;
  public pineconeConfig: PineconeConfiguration;
  public openAIConfig: OpenAIConfiguration;
  public config: GentraceConfiguration;

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
    this.openAIConfig = openAIConfig;
    this.pineconeConfig = pineconeConfig;

    this.config = new GentraceConfiguration({
      apiKey,
      basePath,
    });
  }

  start() {
    return new PipelineRun({ pipeline: this });
  }
}
