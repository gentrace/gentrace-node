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
  Configuration as OpenAIConfiguration,
} from "openai";
import { StepRun } from "../step-run";
import { Pipeline } from "../pipeline";
import { PipelineRun } from "../pipeline-run";
import { Configuration as GentraceConfiguration } from "../../configuration";

type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  pipeline?: Pipeline;
  config: OpenAIConfiguration;
  gentraceConfig: GentraceConfiguration;
};

export class OpenAIPipelineHandler extends OpenAIApi {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    pipelineRun,
    pipeline,
    config,
    gentraceConfig,
  }: OpenAIPipelineHandlerOptions) {
    super(config);

    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;
  }

  public setPipelineRun(pipelineRun: PipelineRun) {
    this.pipelineRun = pipelineRun;
  }

  public setPipeline(pipeline: Pipeline) {
    this.pipeline = pipeline;
  }

  private async setupSelfContainedPipelineRun<T>(
    pipelineId: string | undefined,
    coreLogic: () => T
  ): Promise<T> {
    if (!this.pipelineRun) {
      if (!pipelineId) {
        throw new Error(
          "The pipelineId attribute must be provided if you are not defining a self-contained PipelineRun."
        );
      }

      this.pipeline = new Pipeline({
        id: pipelineId,
        apiKey: this.gentraceConfig.apiKey,
        basePath: this.gentraceConfig.basePath,
      });

      this.pipelineRun = new PipelineRun({
        pipeline: this.pipeline,
      });
    }

    const returnValue = await coreLogic();

    this.pipelineRun.submit().then((pipelineRunId) => {
      console.log("pipelineRunId", pipelineRunId);
    });

    return returnValue;
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
    return this.setupSelfContainedPipelineRun(
      createCompletionRequest.pipelineId,
      async () => {
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
    );
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
    createChatCompletionRequest: CreateChatCompletionRequest &
      OptionalPipelineId,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateChatCompletionResponse, any>> {
    return this.setupSelfContainedPipelineRun(
      createChatCompletionRequest.pipelineId,
      async () => {
        const { messages, ...baseCompletionOptions } =
          createChatCompletionRequest;

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
    );
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
    createEmbeddingRequest: CreateEmbeddingRequest & OptionalPipelineId,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateEmbeddingResponse, any>> {
    return this.setupSelfContainedPipelineRun(
      createEmbeddingRequest.pipelineId,
      async () => {
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
    );
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
} & OptionalPipelineId;

type OptionalPipelineId = {
  pipelineId?: string;
};
