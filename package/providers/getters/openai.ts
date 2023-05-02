import {
  Configuration as OpenAIConfiguration,
  ConfigurationParameters as OpenAIConfigurationParameters,
} from "openai";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { OpenAIPipelineHandler } from "../llms/openai";

class ModifiedOpenAIConfiguration extends OpenAIConfiguration {
  gentraceApiKey: string;
  gentraceBasePath?: string;
  gentraceLogger?: {
    info: (message: string, context?: any) => void;
    warn: (message: string | Error, context?: any) => void;
  };

  constructor(
    modifiedOAIConfig: OpenAIConfigurationParameters & {
      gentraceApiKey: string;
      gentraceBasePath?: string;
      gentraceLogger?: {
        info: (message: string, context?: any) => void;
        warn: (message: string | Error, context?: any) => void;
      };
    }
  ) {
    super(modifiedOAIConfig);
    this.gentraceApiKey = modifiedOAIConfig.gentraceApiKey;
    this.gentraceBasePath = modifiedOAIConfig.gentraceBasePath;
    this.gentraceLogger = modifiedOAIConfig.gentraceLogger;
  }
}

class OpenAIApi extends OpenAIPipelineHandler {
  constructor(modifiedOAIConfig: ModifiedOpenAIConfiguration) {
    const gentraceConfig = new GentraceConfiguration({
      apiKey: modifiedOAIConfig.gentraceApiKey,
      basePath: modifiedOAIConfig.gentraceBasePath,
      logger: modifiedOAIConfig.gentraceLogger,
    });

    super({
      config: modifiedOAIConfig,
      gentraceConfig,
    });
  }
}

export { OpenAIApi, ModifiedOpenAIConfiguration as Configuration };
