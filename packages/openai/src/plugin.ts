import {
  GentracePlugin,
  PipelineRun,
  IGentracePlugin,
  InitPluginFunction,
} from "@gentrace/core";
import { AdvancedOpenAI } from "./handlers/advanced";
import { SimpleOpenAI } from "./handlers/simple";

type OpenAIConfig = {
  apiKey: string;
};

export class OpenAIPlugin extends GentracePlugin<
  OpenAIConfig,
  SimpleOpenAI,
  AdvancedOpenAI
> {
  constructor(public config: OpenAIConfig) {
    super();
  }

  getConfig(): OpenAIConfig {
    return this.config;
  }

  async auth<T>(): Promise<T> {
    // Nothing for OpenAI
    return;
  }

  simple(): SimpleOpenAI {
    return new SimpleOpenAI();
  }

  advanced(): AdvancedOpenAI {
    return new AdvancedOpenAI();
  }
}
