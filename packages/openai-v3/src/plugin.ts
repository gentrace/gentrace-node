import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  InitPluginFunction,
  isConfig,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedOpenAIApi } from "./handlers/advanced";
import { OpenAIConfiguration } from "./handlers/simple";

export const initPlugin: InitPluginFunction<
  OpenAIConfiguration,
  AdvancedOpenAIApi
> = async (configOrSimpleHandle) => {
  if (isConfig(configOrSimpleHandle)) {
    return new OpenAIPlugin(configOrSimpleHandle);
  }

  return new OpenAIPlugin(configOrSimpleHandle.getConfig());
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
