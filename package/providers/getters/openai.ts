import {
  Configuration as OpenAIConfiguration,
  ConfigurationParameters as OpenAIConfigurationParameters,
} from "openai";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { OpenAIPipelineHandler } from "../llms/openai";

class ModifiedOpenAIConfiguration extends OpenAIConfiguration {
  gentraceApiKey: string;
  gentraceBasePath?: string;

  constructor(
    modifiedOAIConfig: OpenAIConfigurationParameters & {
      gentraceApiKey: string;
      gentraceBasePath?: string;
    }
  ) {
    super(modifiedOAIConfig);
    this.gentraceApiKey = modifiedOAIConfig.gentraceApiKey;
    this.gentraceBasePath = modifiedOAIConfig.gentraceBasePath;
  }
}

class OpenAIApi extends OpenAIPipelineHandler {
  constructor(modifiedOAIConfig: ModifiedOpenAIConfiguration) {
    super({
      config: modifiedOAIConfig,
      gentraceConfig: new GentraceConfiguration({
        apiKey: modifiedOAIConfig.gentraceApiKey,
        basePath: modifiedOAIConfig.gentraceBasePath,
      }),
    });
  }
}

export { OpenAIApi, ModifiedOpenAIConfiguration as Configuration };
