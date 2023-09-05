import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  InitPluginFunction,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedPineconeClient } from "./handlers/advanced";
import { PineconeConfiguration } from "./pinecone";

export const initPlugin: InitPluginFunction<
  PineconeConfiguration,
  AdvancedPineconeClient
> = (config: PineconeConfiguration) => {
  return new PineconePlugin(config);
};

export class PineconePlugin extends GentracePlugin<
  PineconeConfiguration,
  AdvancedPineconeClient
> {
  constructor(public config: PineconeConfiguration) {
    super();
  }

  getConfig(): PineconeConfiguration {
    return this.config;
  }

  async auth<T>(): Promise<T> {
    return;
  }

  advanced({
    pipelineRun,
    gentraceConfig,
  }: {
    pipelineRun: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }): AdvancedPineconeClient {
    return new AdvancedPineconeClient({
      pipelineRun,
      gentraceConfig,
      config: this.config,
    });
  }
}
