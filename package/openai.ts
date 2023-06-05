import {
  Configuration as OpenAIConfiguration,
  ConfigurationParameters as OpenAIConfigurationParameters,
} from "openai";
import { Configuration as GentraceConfiguration } from "./configuration";
import { GENTRACE_API_KEY, globalGentraceConfig } from "./providers/init";
import { OpenAIPipelineHandler } from "./providers/llms/openai";

class ModifiedOpenAIConfiguration extends OpenAIConfiguration {
  gentraceApiKey?: string;
  gentraceBasePath?: string;
  gentraceLogger?: {
    info: (message: string, context?: any) => void;
    warn: (message: string | Error, context?: any) => void;
  };

  constructor(
    modifiedOAIConfig: OpenAIConfigurationParameters & {
      /**
       * @deprecated Declare the API key in the init() call instead.
       */
      gentraceApiKey?: string;
      /**
       * @deprecated Declare the base path in the init() call instead.
       */
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
    if (!modifiedOAIConfig.apiKey) {
      throw new Error("API key not provided.");
    }

    if (modifiedOAIConfig.gentraceBasePath) {
      try {
        const url = new URL(modifiedOAIConfig.gentraceBasePath);
        if (url.pathname.startsWith("/api/v1")) {
        } else {
          throw new Error('Gentrace base path must end in "/api/v1".');
        }
      } catch (err) {
        throw new Error(`Invalid Gentrace base path: ${err.message}`);
      }
    }

    let gentraceConfig: GentraceConfiguration | null = null;
    if (modifiedOAIConfig.gentraceApiKey) {
      gentraceConfig = new GentraceConfiguration({
        apiKey: modifiedOAIConfig.gentraceApiKey ?? GENTRACE_API_KEY,
        basePath: modifiedOAIConfig.gentraceBasePath,
        logger: modifiedOAIConfig.gentraceLogger,
      });
    } else if (!globalGentraceConfig) {
      throw new Error(
        "Gentrace API key not provided. Please provide it in the init() call."
      );
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      config: modifiedOAIConfig,
      gentraceConfig,
    });
  }
}

export { OpenAIApi, ModifiedOpenAIConfiguration as Configuration };
