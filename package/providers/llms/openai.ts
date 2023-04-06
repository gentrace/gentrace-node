import { AxiosRequestConfig, AxiosResponse } from "openai/node_modules/axios";
import * as Mustache from "mustache";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  CreateCompletionRequest,
  CreateCompletionResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
  OpenAIApi,
  Configuration,
} from "openai";
import { StepRun } from "../step-run";
import { Pipeline } from "../pipeline";
import { PipelineRun } from "../pipeline-run";

export class OpenAIPipelineHandler extends OpenAIApi {
  private pipelineRun?: PipelineRun;

  constructor({
    pipelineRun,
    pipeline,
  }: {
    pipelineRun?: PipelineRun;
    pipeline: Pipeline;
  }) {
    super(pipeline.openAIConfig);

    this.pipelineRun = pipelineRun;
  }

  public setPipelineRun(pipelineRun: PipelineRun) {
    this.pipelineRun = pipelineRun;
  }

  /**
   *
   * @summary Creates a completion for the provided prompt template, input and model parameters,
   * while instrumenting the request with telemetry to send to the Gentrace API.
   * @param {CreateCompletionTemplateRequest} createCompletionRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  public async createCompletion(
    createCompletionRequest: CreateCompletionTemplateRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateCompletionResponse, any>> {
    const { promptTemplate, promptInputs, ...baseCompletionOptions } =
      createCompletionRequest;

    if (!!(baseCompletionOptions as any).prompt) {
      throw new Error(
        "The prompt attribute cannot be provided when using the GENTRACE SDK. Use promptTemplate and promptInputs instead."
      );
    }

    if (!promptTemplate) {
      throw new Error(
        "The promptTemplate attribute must be provided when using the GENTRACE SDK."
      );
    }

    const renderedPrompt = Mustache.render(promptTemplate, promptInputs);

    const newCompletionOptions: CreateCompletionRequest = {
      ...baseCompletionOptions,
      prompt: renderedPrompt,
    };

    const startTime = performance.timeOrigin + performance.now();
    const completion = await super.createCompletion(
      newCompletionOptions,
      options
    );

    const endTime = performance.timeOrigin + performance.now();

    const elapsedTime = Math.floor(endTime - startTime);

    // User and suffix parameters are inputs not model parameters
    const { user, suffix, ...partialModelParams } = baseCompletionOptions;

    this.pipelineRun.addStepRun(
      new OpenAICreateCompletionStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        {
          prompt: promptInputs,
          user,
          suffix,
        },
        { ...partialModelParams, promptTemplate },

        completion.data
      )
    );

    return completion;
  }

  /**
   *
   * @summary Creates a completion for the provided chat messages and model parameters,
   * while instrumenting the request with telemetry to send to the Gentrace API.
   *
   * @param {CreateChatCompletionRequest} createChatCompletionRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  public async createChatCompletion(
    createChatCompletionRequest: CreateChatCompletionRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateChatCompletionResponse, any>> {
    const { messages, ...baseCompletionOptions } = createChatCompletionRequest;

    const startTime = performance.timeOrigin + performance.now();
    const completion = await super.createChatCompletion(
      createChatCompletionRequest,
      options
    );

    const endTime = performance.timeOrigin + performance.now();

    const elapsedTime = Math.floor(endTime - startTime);

    // user parameter is an input, not a model parameter
    const { user, ...modelParams } = baseCompletionOptions;

    this.pipelineRun.addStepRun(
      new OpenAICreateChatCompletionStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        { messages, user },
        modelParams,
        completion.data
      )
    );

    return completion;
  }

  /**
   *
   * @summary Creates an embedding vector representing the input text, while instrumenting
   * the request with telemetry to send to the GENTRACE API.
   *
   * @param {CreateEmbeddingRequest} createEmbeddingRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof OpenAIApi
   */
  public async createEmbedding(
    createEmbeddingRequest: CreateEmbeddingRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateEmbeddingResponse, any>> {
    const { model, ...inputParams } = createEmbeddingRequest;

    const startTime = performance.timeOrigin + performance.now();

    const completion = await super.createEmbedding(
      createEmbeddingRequest,
      options
    );

    const endTime = performance.timeOrigin + performance.now();

    const elapsedTime = Math.floor(endTime - startTime);

    this.pipelineRun.addStepRun(
      new OpenAICreateEmbeddingStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        { ...inputParams },
        { model },
        completion.data
      )
    );

    return completion;
  }
}

class OpenAICreateCompletionStepRun extends StepRun {
  public inputs: {
    prompt?: Record<string, string>;
    user?: string;
    suffix?: string;
  };
  public modelParams: Omit<
    CreateCompletionRequest,
    "prompt" | "user" | "suffix"
  > & {
    promptTemplate: string;
  };
  public response: CreateCompletionResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: {
      prompt?: Record<string, string>;
      user?: string;
      suffix?: string;
    },
    modelParams: Omit<CreateCompletionRequest, "prompt" | "user" | "suffix"> & {
      promptTemplate: string;
    },
    response: CreateCompletionResponse
  ) {
    super(
      "openai",
      "openai_createCompletion",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response
    );
  }
}

class OpenAICreateChatCompletionStepRun extends StepRun {
  public modelParams: Omit<CreateChatCompletionRequest, "messages" | "user">;
  public inputs: {
    messages?: Array<ChatCompletionRequestMessage>;
    user?: string;
  };

  public response: CreateCompletionResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: {
      messages?: Array<ChatCompletionRequestMessage>;
      user?: string;
    },
    modelParams: Omit<CreateChatCompletionRequest, "messages" | "user">,
    response: CreateCompletionResponse
  ) {
    super(
      "openai",
      "openai_createChatCompletion",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response
    );
  }
}

class OpenAICreateEmbeddingStepRun extends StepRun {
  public inputs: Omit<CreateEmbeddingRequest, "model">;
  public modelParams: Omit<CreateEmbeddingRequest, "input" | "user">;
  public response: CreateEmbeddingResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<CreateEmbeddingRequest, "model">,
    modelParams: Omit<CreateEmbeddingRequest, "input" | "user">,
    response: CreateEmbeddingResponse
  ) {
    super(
      "openai",
      "openai_createEmbedding",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response
    );
  }
}

export type CreateCompletionTemplateRequest = Omit<
  CreateCompletionRequest,
  "prompt"
> & {
  promptTemplate?: string;
  promptInputs?: Record<string, string>;
};
