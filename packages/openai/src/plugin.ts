import {
  Configuration,
  GentracePlugin,
  InitPluginFunction,
  isConfig,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedOpenAI } from "./handlers/advanced";
import { GentraceClientOptions as GentraceOpenAIClientOptions } from "./openai";

export const initOpenAIPlugin: InitPluginFunction<
  GentraceOpenAIClientOptions,
  AdvancedOpenAI
> = async (config) => {
  if (isConfig(config)) {
    return new OpenAIPlugin(config);
  }

  return new OpenAIPlugin(config.getConfig());
};

export class OpenAIPlugin extends GentracePlugin<
  GentraceOpenAIClientOptions,
  AdvancedOpenAI
> {
  constructor(public config: GentraceOpenAIClientOptions) {
    super();
  }

  getConfig(): GentraceOpenAIClientOptions {
    return this.config;
  }

  advanced({
    pipelineRun,
    gentraceConfig,
  }: {
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): AdvancedOpenAI {
    return new AdvancedOpenAI({
      pipelineRun,
      gentraceConfig,
      ...this.config,
    });
  }
}
