import { AxiosRequestConfig, AxiosResponse } from "axios";
// @ts-ignore: the typings from @types/mustache are incorrect
import Mustache from "mustache";
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
import {
  StepRun,
  Pipeline,
  PipelineRun,
  Configuration,
  Context,
} from "@gentrace/core";

type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  config: OpenAIConfiguration;
  gentraceConfig: Configuration;
};

export class OpenAIPipelineHandler extends OpenAIApi {
  private pipelineRun?: PipelineRun;
  private config?: OpenAIConfiguration;
  private gentraceConfig: Configuration;

  constructor({
    pipelineRun,
    config,
    gentraceConfig,
  }: OpenAIPipelineHandlerOptions) {
    super(config);

    this.config = config;

    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  private async setupSelfContainedPipelineRun<T>(
    pipelineSlug: string | undefined,
    options: AxiosRequestConfig | undefined,
    coreLogic: (pipelineRun: PipelineRun) => Promise<T>,
  ): Promise<T & { pipelineRunId?: string }> {
    let isSelfContainedPullRequest = !this.pipelineRun && pipelineSlug;
    const hasSpecifiedStreamResponseType = options?.responseType === "stream";

    let pipelineRun = this.pipelineRun;

    if (isSelfContainedPullRequest) {
      const pipeline = new Pipeline({
        id: pipelineSlug,
        slug: pipelineSlug,
        apiKey: this.gentraceConfig.apiKey,
        basePath: this.gentraceConfig.basePath,
        logger: this.gentraceConfig.logger,
      });

      pipelineRun = new PipelineRun({
        pipeline,
      });
    }

    const returnValue = await coreLogic(pipelineRun);

    if (isSelfContainedPullRequest) {
      if (hasSpecifiedStreamResponseType) {
        (returnValue as unknown as { pipelineRunId: string }).pipelineRunId =
          pipelineRun.getId();

        return returnValue as T & { pipelineRunId: string };
      }

      const { pipelineRunId } = await pipelineRun.submit();
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
  public async createCompletionInner(
    createCompletionRequest: CreateCompletionTemplateRequest,
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateCompletionResponse, any> & { pipelineRunId?: string }
  > {
    return await this.setupSelfContainedPipelineRun<
      AxiosResponse<CreateCompletionResponse, any>
    >(
      createCompletionRequest.pipelineId ??
        createCompletionRequest.pipelineSlug,
      options,
      async (pipelineRun) => {
        const hasSpecifiedStreamResponseType =
          options?.responseType === "stream";

        const {
          promptTemplate,
          promptInputs,
          prompt,
          pipelineId: _pipelineId,
          pipelineSlug: _pipelineSlug,
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

        const startTime = Date.now();
        const completion = await super.createCompletion(
          newCompletionOptions,
          options,
        );

        let finalData: CreateCompletionResponse = completion.data;

        if (
          !hasSpecifiedStreamResponseType &&
          baseCompletionOptions.stream &&
          typeof completion.data === "string"
        ) {
          const rawData = completion.data as string;
          const allLines = rawData
            .split("\n")
            .filter(
              (line) => line.trim().length > 0 && line.startsWith("data:"),
            )
            .map((line) => line.slice("data:".length).trim())
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            })
            .filter((line) => line !== null);

          finalData = createCompletionStreamResponse(
            allLines,
          ) as CreateCompletionResponse;
        }

        if (hasSpecifiedStreamResponseType && baseCompletionOptions.stream) {
          const allLines: {
            id: string;
            object: string;
            created: number;
            model: string;
            choices: Choice[];
          }[] = [];

          // @ts-ignore
          completion.data.on("data", (data) => {
            const lines = data
              .toString()
              .split("\n")
              .filter((line: any) => line.trim() !== "");
            for (const line of lines) {
              const message = line.replace(/^data: /, "");
              if (message === "[DONE]") {
                const endStreamTime = Date.now();
                finalData = createCompletionStreamResponse(
                  allLines,
                ) as CreateCompletionResponse;
                pipelineRun?.addStepRunNode(
                  new OpenAICreateCompletionStepRun(
                    elapsedTime,
                    new Date(startTime).toISOString(),
                    new Date(endStreamTime).toISOString(),
                    {
                      prompt:
                        promptTemplate && promptInputs ? promptInputs : prompt,
                      user,
                      suffix,
                    },
                    { ...partialModelParams, promptTemplate },
                    finalData,
                    createCompletionRequest?.gentrace ?? {},
                  ),
                );
                return; // Stream finished
              }
              try {
                const parsed = JSON.parse(message);
                allLines.push(parsed);
              } catch (error) {
                console.error(
                  "Could not JSON parse stream message",
                  message,
                  error,
                );
              }
            }
          });
        }

        completion.data = finalData;

        const endTime = Date.now();

        const elapsedTime = Math.floor(endTime - startTime);

        // User and suffix parameters are inputs not model parameters
        const { user, suffix, ...partialModelParams } = baseCompletionOptions;

        if (!hasSpecifiedStreamResponseType) {
          pipelineRun?.addStepRunNode(
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
              finalData,
              createCompletionRequest?.gentrace ?? {},
            ),
          );
        }

        return completion;
      },
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
  public async createChatCompletionInner(
    createChatCompletionRequest: CreateChatCompletionTemplateRequest,
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateChatCompletionResponse, any> & {
      pipelineRunId?: string;
    }
  > {
    return this.setupSelfContainedPipelineRun(
      createChatCompletionRequest.pipelineId ??
        createChatCompletionRequest.pipelineSlug,
      options,
      async (pipelineRun) => {
        const hasSpecifiedStreamResponseType =
          options?.responseType === "stream";

        const {
          messages,
          pipelineId: _pipelineId,
          pipelineSlug: _pipelineSlug,
          ...baseCompletionOptions
        } = createChatCompletionRequest;

        const renderedMessages = createRenderedChatMessages(messages);

        const contentTemplatesArray = messages.map<string | null>((message) => {
          return message.contentTemplate ?? null;
        });

        const contentInputsArray = messages.map<Record<string, string> | null>(
          (message) => {
            return message.contentInputs ?? null;
          },
        );

        const startTime = Date.now();
        const completion = await super.createChatCompletion(
          {
            messages: renderedMessages,
            ...baseCompletionOptions,
          },
          options,
        );

        const endTime = Date.now();

        let finalData: CreateChatCompletionResponse = completion.data;

        // This is only for the case where the user has specified a stream response type
        // but has specified the stream value
        if (
          !hasSpecifiedStreamResponseType &&
          baseCompletionOptions.stream &&
          typeof completion.data === "string"
        ) {
          const rawData = completion.data as string;
          const allLines = rawData
            .split("\n")
            .filter(
              (line) => line.trim().length > 0 && line.startsWith("data:"),
            )
            .map((line) => line.slice("data:".length).trim())
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            })
            .filter((line) => line !== null);

          finalData = createChatCompletionStreamResponse(
            allLines,
          ) as CreateChatCompletionResponse;
        }

        if (hasSpecifiedStreamResponseType && baseCompletionOptions.stream) {
          const allLines: {
            id: string;
            object: string;
            created: number;
            model: string;
            choices: Choice[];
          }[] = [];

          // @ts-ignore
          completion.data.on("data", async (data) => {
            const lines = data
              .toString()
              .split("\n")
              .filter((line: any) => line.trim() !== "");
            for (const line of lines) {
              const message = line.replace(/^data: /, "");
              if (message === "[DONE]") {
                const endStreamTime = Date.now();
                finalData = createChatCompletionStreamResponse(
                  allLines,
                ) as CreateChatCompletionResponse;
                pipelineRun?.addStepRunNode(
                  new OpenAICreateChatCompletionStepRun(
                    elapsedTime,
                    new Date(startTime).toISOString(),
                    new Date(endStreamTime).toISOString(),
                    {
                      messages: renderedMessages,
                      user,
                      contentInputs: contentInputsArray,
                    },
                    { ...modelParams, contentTemplates: contentTemplatesArray },
                    finalData,
                    createChatCompletionRequest?.gentrace ?? {},
                  ),
                );

                const { pipelineRunId } = await pipelineRun.submit();
                return; // Stream finished
              }
              try {
                const parsed = JSON.parse(message);
                allLines.push(parsed);
              } catch (error) {
                console.error(
                  "Could not JSON parse stream message",
                  message,
                  error,
                );
              }
            }
          });
        }

        completion.data = finalData;

        const elapsedTime = Math.floor(endTime - startTime);

        // user parameter is an input, not a model parameter
        const { user, ...modelParams } = baseCompletionOptions;

        if (!hasSpecifiedStreamResponseType) {
          pipelineRun?.addStepRunNode(
            new OpenAICreateChatCompletionStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              {
                messages: renderedMessages,
                user,
                contentInputs: contentInputsArray,
              },
              { ...modelParams, contentTemplates: contentTemplatesArray },
              finalData,
              createChatCompletionRequest?.gentrace ?? {},
            ),
          );
        }

        return completion;
      },
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
  public async createEmbeddingInner(
    createEmbeddingRequest: CreateEmbeddingRequest & {
      pipelineId?: string;
      pipelineSlug?: string;
      gentrace?: Context;
    },
    options?: AxiosRequestConfig,
  ): Promise<
    AxiosResponse<CreateEmbeddingResponse, any> & { pipelineRunId?: string }
  > {
    return this.setupSelfContainedPipelineRun(
      createEmbeddingRequest.pipelineId ?? createEmbeddingRequest.pipelineSlug,
      options,
      async (pipelineRun) => {
        const {
          model,
          pipelineId: _pipelineId,
          pipelineSlug: _pipelineSlug,
          ...inputParams
        } = createEmbeddingRequest;

        const startTime = Date.now();

        const completion = await super.createEmbedding(
          { model, ...inputParams },
          options,
        );

        const endTime = Date.now();

        const elapsedTime = Math.floor(endTime - startTime);

        pipelineRun?.addStepRunNode(
          new OpenAICreateEmbeddingStepRun(
            elapsedTime,
            new Date(startTime).toISOString(),
            new Date(endTime).toISOString(),
            { ...inputParams },
            { model },
            completion.data,
            createEmbeddingRequest?.gentrace ?? {},
          ),
        );

        return completion;
      },
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
    response: CreateCompletionResponse,
    context: Context,
  ) {
    super(
      "openai",
      "openai_createCompletion",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response,
      context,
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
      contentInputs?: Record<string, string>[];
    },
    modelParams: Omit<CreateChatCompletionRequest, "messages" | "user"> & {
      contentTemplates?: string[];
    },
    response: CreateCompletionResponse,
    context: Context,
  ) {
    super(
      "openai",
      "openai_createChatCompletion",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response,
      context,
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
    response: CreateEmbeddingResponse,
    context: Context,
  ) {
    super(
      "openai",
      "openai_createEmbedding",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response,
      context,
    );
  }
}

export type CreateCompletionTemplateRequest = CreateCompletionRequest & {
  promptTemplate?: string;
  promptInputs?: Record<string, string>;
} & {
  pipelineId?: string;
  pipelineSlug?: string;
  gentrace?: Context;
};

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
} & {
  pipelineId?: string;
  pipelineSlug?: string;
  gentrace?: Context;
};

function createRenderedChatMessages(
  messages: ChatCompletionRequestMessageTemplate[],
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

interface Choice {
  text?: string;
  delta?: {
    content?: string;
  };
  index?: number;
  finish_reason?: string;
}

function createChatCompletionStreamResponse(
  streamList: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
  }[],
) {
  let finalResponseString = "";
  let model = "";
  let id = "";
  let created = 0;
  for (const value of streamList) {
    model = value.model;
    id = value.id;
    created = value.created;

    if (value.choices && value.choices.length > 0) {
      const firstChoice = value.choices[0];
      if (firstChoice.text) {
        finalResponseString += firstChoice.text;
      } else if (firstChoice.delta && firstChoice.delta.content) {
        finalResponseString += firstChoice.delta.content;
      } else if (
        firstChoice.finish_reason &&
        firstChoice.finish_reason === "stop"
      ) {
        break;
      }
    }
  }

  const finalResponse: CreateChatCompletionResponse = {
    id,
    // Override this so it doesn't show chat.completion.chunk
    object: "chat.completion",
    created,
    model,
    choices: [
      {
        finish_reason: null,
        index: 0,
        message: { content: finalResponseString, role: "assistant" },
      },
    ],
  };

  return finalResponse;
}

function createCompletionStreamResponse(
  streamList: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Choice[];
  }[],
) {
  let finalResponseString = "";
  let model = "";
  let id = "";
  let created = 0;
  for (const value of streamList) {
    model = value.model;
    id = value.id;
    created = value.created;

    if (value.choices && value.choices.length > 0) {
      const firstChoice = value.choices[0];
      if (firstChoice.text) {
        finalResponseString += firstChoice.text;
      } else if (firstChoice.delta && firstChoice.delta.content) {
        finalResponseString += firstChoice.delta.content;
      } else if (
        firstChoice.finish_reason &&
        firstChoice.finish_reason === "stop"
      ) {
        break;
      }
    }
  }

  const finalResponse: CreateCompletionResponse = {
    id,
    // Override this so it doesn't show chat.completion.chunk
    object: "text_completion",
    created,
    model,
    choices: [
      {
        text: finalResponseString,
        index: 0,
        logprobs: null,
        finish_reason: "length",
      },
    ],
  };

  return finalResponse;
}
