import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  InitPluginFunction,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedOpenAIApi } from "./handlers/advanced";
import { OpenAIConfiguration } from "./handlers/simple";

export const initPlugin: InitPluginFunction<
  OpenAIConfiguration,
  AdvancedOpenAIApi
> = async (config: OpenAIConfiguration) => {
  return new OpenAIPlugin(config);
};

export class OpenAIPlugin extends GentracePlugin<
  OpenAIConfiguration,
  AdvancedOpenAIApi
> {
  constructor(public config: OpenAIConfiguration) {
    super();
  }

  getConfig(): OpenAIConfiguration {
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
  }): AdvancedOpenAIApi {
    return new AdvancedOpenAIApi({
      pipelineRun,
      gentraceConfig,
      config: this.config,
    });
  }
}
