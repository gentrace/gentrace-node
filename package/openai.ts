import OpenAI, { ClientOptions } from "openai";
import { Configuration as GentraceConfiguration } from "./configuration";
import { GENTRACE_API_KEY, globalGentraceConfig } from "./providers/init";
import { OpenAIPipelineHandler } from "./providers/llms/openai";

type GentraceClientOptions = ClientOptions & {
  gentraceApiKey?: string;
  gentraceBasePath?: string;
  gentraceLogger?: {
    info: (message: string, context?: any) => void;
    warn: (message: string | Error, context?: any) => void;
  };
};

class GentraceOpenAI extends OpenAIPipelineHandler {
  constructor(options: GentraceClientOptions) {
    const { gentraceApiKey, gentraceBasePath, gentraceLogger, ...oaiOptions } =
      options;

    if (options.gentraceBasePath) {
      try {
        const url = new URL(options.gentraceBasePath);
        if (url.pathname.startsWith("/api/v1")) {
        } else {
          throw new Error('Gentrace base path must end in "/api/v1".');
        }
      } catch (err) {
        throw new Error(`Invalid Gentrace base path: ${err.message}`);
      }
    }

    let gentraceConfig: GentraceConfiguration | null = null;
    if (options.gentraceApiKey) {
      gentraceConfig = new GentraceConfiguration({
        apiKey: options.gentraceApiKey ?? GENTRACE_API_KEY,
        basePath: options.gentraceBasePath,
        logger: options.gentraceLogger,
      });
    } else if (!globalGentraceConfig) {
      throw new Error(
        "Gentrace API key not provided. Please provide it in the init() call."
      );
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      ...oaiOptions,
      gentraceConfig,
    });
  }
}

export { GentraceOpenAI as OpenAIApi };
