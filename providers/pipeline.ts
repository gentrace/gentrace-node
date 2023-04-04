import { PipelineRun } from "./pipeline-run";
import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";

type PineconeConfiguration = {
  apiKey: string;
  environment: string;
};

export class Pipeline {
  public id: string;
  public apiKey: string;

  public pineconeConfiguration: PineconeConfiguration;
  public openAIConfiguration: OpenAIConfiguration;

  constructor({
    id,
    apiKey,
    openaiConfiguration,
    pineconeConfiguration,
  }: {
    id: string;
    apiKey: string;
    openaiConfiguration: OpenAIConfiguration;
    pineconeConfiguration: PineconeConfiguration;
  }) {
    this.id = id;
    this.apiKey = apiKey;
    this.openAIConfiguration = openaiConfiguration;
    this.pineconeConfiguration = pineconeConfiguration;
  }

  start() {
    return new PipelineRun({ pipeline: this });
  }
}
