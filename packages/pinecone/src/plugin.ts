import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  InitPluginFunction,
  isConfig,
  PipelineRun,
} from "@gentrace/core";
import { PineconeConfiguration } from "@pinecone-database/pinecone";
import { AdvancedPinecone } from "./handlers/advanced";

export const initPlugin: InitPluginFunction<
  PineconeConfiguration,
  AdvancedPinecone
> = async (configOrSimpleHandler) => {
  if (isConfig(configOrSimpleHandler)) {
    return new PineconePlugin(configOrSimpleHandler);
  }

  return new PineconePlugin(configOrSimpleHandler.getConfig());
};

export class PineconePlugin extends GentracePlugin<
  PineconeConfiguration,
  AdvancedPinecone
> {
  constructor(public config: PineconeConfiguration) {
    super();
  }

  getConfig(): PineconeConfiguration {
    return this.config;
  }

  advanced({
    pipelineRun,
    gentraceConfig,
  }: {
    pipelineRun: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }): AdvancedPinecone {
    return new AdvancedPinecone({
      pipelineRun,
      gentraceConfig,
      config: this.config,
    });
  }
}
