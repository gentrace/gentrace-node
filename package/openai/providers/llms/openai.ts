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
import { OptionalPipelineId } from "../utils";

type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  pipeline?: Pipeline;
  config: OpenAIConfiguration;
  gentraceConfig: GentraceConfiguration;
};

export class OpenAIPipelineHandler extends OpenAIApi {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private config?: OpenAIConfiguration;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    pipelineRun,
    pipeline,
    config,
    gentraceConfig,
  }: OpenAIPipelineHandlerOptions) {
    super(config);

    this.config = config;

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
    coreLogic: () => Promise<T>
  ): Promise<T & { pipelineRunId?: string }> {
    let isSelfContainedPipelineRun = !this.pipelineRun && pipelineId;

    if (isSelfContainedPipelineRun) {
      this.pipeline = new Pipeline({
        id: pipelineId,
        apiKey: this.gentraceConfig.apiKey,
        basePath: this.gentraceConfig.basePath,
        logger: this.gentraceConfig.logger,
      });

      this.pipelineRun = new PipelineRun({
        pipeline: this.pipeline,
      });
    }

    const returnValue = await coreLogic();

    if (isSelfContainedPipelineRun) {
      const { pipelineRunId } = await this.pipelineRun.submit();
      (returnValue as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return returnValue as T & { pipelineRunId: string };
    }

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
  ): Promise<
    AxiosResponse<CreateCompletionResponse, any> & { pipelineRunId?: string }
  > {
    return await this.setupSelfContainedPipelineRun<
      AxiosResponse<CreateCompletionResponse, any>
    >(createCompletionRequest.pipelineId, async () => {
      const {
        promptTemplate,
        promptInputs,
        prompt,
        pipelineId: _pipelineId,
        ...baseCompletionOptions
      } = createCompletionRequest;

      let renderedPrompt = prompt;

      if (promptTemplate && promptInputs) {
        renderedPrompt = Mustache.render(promptTemplate, promptInputs);
      }

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

      this.pipelineRun?.addStepRun(
        new OpenAICreateCompletionStepRun(
          elapsedTime,
          new Date(startTime).toISOString(),
          new Date(endTime).toISOString(),
          {
            prompt: promptTemplate && promptInputs ? promptInputs : prompt,
            user,
            suffix,
          },
          { ...partialModelParams, promptTemplate },

          completion.data
        )
      );

      return completion;
    });
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
    createChatCompletionRequest: CreateChatCompletionTemplateRequest,
    options?: AxiosRequestConfig
  ): Promise<
    AxiosResponse<CreateChatCompletionResponse, any> & {
      pipelineRunId?: string;
    }
  > {
    return this.setupSelfContainedPipelineRun(
      createChatCompletionRequest.pipelineId,
      async () => {
        const {
          messages,
          pipelineId: _pipelineId,
          ...baseCompletionOptions
        } = createChatCompletionRequest;

        const renderedMessages = createRenderedChatMessages(messages);

        const startTime = performance.timeOrigin + performance.now();
        const completion = await super.createChatCompletion(
          { messages: renderedMessages, ...baseCompletionOptions },
          options
        );

        const endTime = performance.timeOrigin + performance.now();

        const elapsedTime = Math.floor(endTime - startTime);

        // user parameter is an input, not a model parameter
        const { user, ...modelParams } = baseCompletionOptions;

        this.pipelineRun?.addStepRun(
          new OpenAICreateChatCompletionStepRun(
            elapsedTime,
            new Date(startTime).toISOString(),
            new Date(endTime).toISOString(),
            { messages: renderedMessages, user },
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
  ): Promise<
    AxiosResponse<CreateEmbeddingResponse, any> & { pipelineRunId?: string }
  > {
    return this.setupSelfContainedPipelineRun(
      createEmbeddingRequest.pipelineId,
      async () => {
        const {
          model,
          pipelineId: _pipelineId,
          ...inputParams
        } = createEmbeddingRequest;

        const startTime = performance.timeOrigin + performance.now();

        const completion = await super.createEmbedding(
          { model, ...inputParams },
          options
        );

        const endTime = performance.timeOrigin + performance.now();

        const elapsedTime = Math.floor(endTime - startTime);

        this.pipelineRun?.addStepRun(
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
      prompt?: Record<string, string> | string | any[];
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

export type CreateCompletionTemplateRequest = CreateCompletionRequest & {
  promptTemplate?: string;
  promptInputs?: Record<string, string>;
} & OptionalPipelineId;

type ChatCompletionRequestMessageTemplate = Omit<
  ChatCompletionRequestMessage,
  "content"
> & {
  content?: string;
  contentTemplate?: string;
  contentInputs?: Record<string, string>;
};

export type CreateChatCompletionTemplateRequest = Omit<
  CreateChatCompletionRequest,
  "messages"
> & {
  messages: ChatCompletionRequestMessageTemplate[];
} & OptionalPipelineId;

function createRenderedChatMessages(
  messages: ChatCompletionRequestMessageTemplate[]
) {
  let newMessages: ChatCompletionRequestMessage[] = [];
  for (let message of messages) {
    if (message.contentTemplate && message.contentInputs) {
      const { contentTemplate, contentInputs, ...rest } = message;
      newMessages.push({
        ...rest,
        content: Mustache.render(contentTemplate, contentInputs),
      });
    } else if (message.content) {
      newMessages.push({ ...message } as ChatCompletionRequestMessage);
    }
  }

  return newMessages;
}
