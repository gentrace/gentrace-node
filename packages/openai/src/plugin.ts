import {
  Configuration,
  GentracePlugin,
  InitPluginFunction,
  Pipeline,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedOpenAI } from "./handlers/advanced";
import { SimpleOpenAI } from "./handlers/simple";
import { GentraceClientOptions as GentraceOpenAIClientOptions } from "./openai";

export const initPlugin: InitPluginFunction<
  GentraceOpenAIClientOptions,
  SimpleOpenAI,
  AdvancedOpenAI
> = (config: GentraceOpenAIClientOptions) => {
  // TODO: initialize auth here
  return new OpenAIPlugin(config);
};

export class OpenAIPlugin extends GentracePlugin<
  GentraceOpenAIClientOptions,
  SimpleOpenAI,
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
    pipeline,
    pipelineRun,
    gentraceConfig,
  }: {
    pipeline: Pipeline;
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): AdvancedOpenAI {
    return new AdvancedOpenAI({
      pipeline,
      pipelineRun,
      gentraceConfig,
      ...this.config,
    });
  }
}
