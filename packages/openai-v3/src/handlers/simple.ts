import {
  Configuration as GentraceConfiguration,
  Context,
  GENTRACE_API_KEY,
  globalGentraceConfig,
  SimpleHandler,
  PipelineRun,
  PluginContext,
} from "@gentrace/core";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  Configuration,
  Configuration as OpenAIConfiguration,
  ConfigurationParameters as OpenAIConfigurationParameters,
  CreateChatCompletionResponse,
  CreateCompletionResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
} from "openai";
import {
  CreateChatCompletionTemplateRequest,
  CreateCompletionTemplateRequest,
  OpenAIPipelineHandler,
} from "../openai";

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
    },
  ) {
    super(modifiedOAIConfig);
    this.gentraceApiKey = modifiedOAIConfig.gentraceApiKey;
    this.gentraceBasePath = modifiedOAIConfig.gentraceBasePath;
    this.gentraceLogger = modifiedOAIConfig.gentraceLogger;
  }
}

type CreateChatCompletionTemplateRequestRestricted = Omit<
  CreateChatCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: PluginContext;
};

type CreateCompletionTemplateRequestRestricted = Omit<
  CreateCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: PluginContext;
};

type CreateEmbeddingRequestRestricted = Omit<
  CreateEmbeddingRequest & {
    pipelineId?: string;
    pipelineSlug?: string;
    gentrace?: Context;
  },
  "gentrace"
> & {
  gentrace?: PluginContext;
};

class SimpleOpenAIApi
  extends OpenAIPipelineHandler
  implements SimpleHandler<OpenAIConfiguration>
{
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
        "Gentrace API key not provided. Please provide it in the init() call.",
      );
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      config: modifiedOAIConfig,
      gentraceConfig,
    });
  }

  getConfig(): OpenAIConfiguration {
    return this.config;
  }

  setPipelineRun(pipelineRun: PipelineRun): void {
    this.pipelineRun = pipelineRun;
  }

  /**
   *
   * @summary Creates a completion for the provided prompt template, input and model parameters,
   * while instrumenting the request with telemetry to send to the Gentrace API.
   * @param {CreateChatCompletionTemplateRequestRestricted} createCompletionRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  // @ts-ignore: The parameters will never match the native parent class, so we have to ignore
  public async createChatCompletion(
    createChatCompletionRequest: CreateChatCompletionTemplateRequestRestricted,
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateChatCompletionResponse, any> & {
      pipelineRunId?: string;
    }
  > {
    return super.createChatCompletionInner(
      createChatCompletionRequest,
      options,
    );
  }

  /**
   *
   * @summary Creates a completion for the provided prompt template, input and model parameters,
   * while instrumenting the request with telemetry to send to the Gentrace API.
   * @param {CreateCompletionTemplateRequestRestricted} createCompletionRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  public async createCompletion(
    createCompletionRequest: CreateCompletionTemplateRequestRestricted,
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateCompletionResponse, any> & { pipelineRunId?: string }
  > {
    return super.createCompletionInner(createCompletionRequest, options);
  }

  /**
   *
   * @summary Creates an embedding vector representing the input text, while instrumenting
   * the request with telemetry to send to the GENTRACE API.
   *
   * @param {CreateEmbeddingRequestRestricted} createEmbeddingRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  public async createEmbedding(
    createEmbeddingRequest: CreateEmbeddingRequestRestricted,
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateEmbeddingResponse, any> & { pipelineRunId?: string }
  > {
    return this.createEmbeddingInner(createEmbeddingRequest, options);
  }
}

export { SimpleOpenAIApi, ModifiedOpenAIConfiguration as OpenAIConfiguration };
