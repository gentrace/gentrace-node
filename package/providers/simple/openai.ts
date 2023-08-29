import { AxiosRequestConfig, AxiosResponse } from "openai/node_modules/axios";
import {
  Configuration as OpenAIConfiguration,
  ConfigurationParameters as OpenAIConfigurationParameters,
  CreateChatCompletionResponse,
  CreateCompletionResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
} from "openai";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { GENTRACE_API_KEY, globalGentraceConfig } from "../../providers/init";
import {
  CreateChatCompletionTemplateRequest,
  CreateCompletionTemplateRequest,
  OpenAIPipelineHandler,
} from "../../handlers/llms/openai";
import { GentraceParams } from "../../providers/utils";

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

type CreateChatCompletionTemplateRequestRestricted = Omit<
  CreateChatCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: {
    userId?: string;
  };
};

type CreateCompletionTemplateRequestRestricted = Omit<
  CreateCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: {
    userId?: string;
  };
};

type CreateEmbeddingRequestRestricted = Omit<
  CreateEmbeddingRequest & GentraceParams,
  "gentrace"
> & {
  gentrace?: {
    userId?: string;
  };
};

class SimpleOpenAIApi extends OpenAIPipelineHandler {
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
    options?: AxiosRequestConfig
  ): Promise<
    AxiosResponse<CreateChatCompletionResponse, any> & {
      pipelineRunId?: string;
    }
  > {
    return super.createChatCompletionInner(
      createChatCompletionRequest,
      options
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
    options?: AxiosRequestConfig
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
    options?: AxiosRequestConfig
  ): Promise<
    AxiosResponse<CreateEmbeddingResponse, any> & { pipelineRunId?: string }
  > {
    return this.createEmbeddingInner(createEmbeddingRequest, options);
  }
}

export { SimpleOpenAIApi, ModifiedOpenAIConfiguration as Configuration };
