import {
  CreateChatCompletionResponse,
  CreateCompletionResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
} from "openai";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  CreateChatCompletionTemplateRequest,
  CreateCompletionTemplateRequest,
  OpenAIPipelineHandler,
} from "../openai";
import { PluginStepRunContext, Context } from "@gentrace/core";

type CreateChatCompletionTemplateRequestRestricted = Omit<
  CreateChatCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: PluginStepRunContext;
};

type CreateCompletionTemplateRequestRestricted = Omit<
  CreateCompletionTemplateRequest,
  "gentrace"
> & {
  gentrace?: PluginStepRunContext;
};

type CreateEmbeddingRequestRestricted = Omit<
  CreateEmbeddingRequest & {
    pipelineId?: string;
    pipelineSlug?: string;
    gentrace?: Context;
  },
  "gentrace"
> & {
  gentrace?: PluginStepRunContext;
};

class AdvancedOpenAIApi extends OpenAIPipelineHandler {
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
    return this.createEmbedding(createEmbeddingRequest, options);
  }
}

export { AdvancedOpenAIApi };
