import {
  Configuration,
  GentracePlugin,
  InitPluginFunction,
  Pipeline,
} from "@gentrace/core";
import { AdvancedOpenAI } from "./handlers/advanced";
import { SimpleOpenAI } from "./handlers/simple";
import { GentraceClientOptions as GentraceOpenAIClientOptions } from "./openai";

export const initPlugin: InitPluginFunction<
  GentraceOpenAIClientOptions,
  SimpleOpenAI,
  AdvancedOpenAI
> = (config: GentraceOpenAIClientOptions) => {
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
    gentraceConfig,
  }: {
    pipeline: Pipeline;
    gentraceConfig: Configuration;
  }): AdvancedOpenAI {
    return new AdvancedOpenAI({
      pipeline,
      gentraceConfig,
      ...this.config,
    });
  }
}
