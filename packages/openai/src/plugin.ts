import {
  Configuration,
  GentracePlugin,
  InitPluginFunction,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedOpenAI } from "./handlers/advanced";
import { GentraceClientOptions as GentraceOpenAIClientOptions } from "./openai";

export const initPlugin: InitPluginFunction<
  GentraceOpenAIClientOptions,
  AdvancedOpenAI
> = (config: GentraceOpenAIClientOptions) => {
  return new OpenAIPlugin(config);
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

  async auth<T>(): Promise<T> {
    return;
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
