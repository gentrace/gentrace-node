// @ts-ignore: the typings from @types/mustache are incorrect
import Mustache from "mustache";
import {
  Configuration as GentraceConfiguration,
  Context,
  Pipeline,
  PipelineRun,
  StepRun,
} from "@gentrace/core";
import OpenAI, { ClientOptions } from "openai";
import { APIPromise, RequestOptions } from "openai/core";
import {
  Chat,
  Completion,
  CompletionCreateParams,
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
  ModerationCreateParams,
  ModerationCreateResponse,
} from "openai/resources";
import { ChatCompletion, ChatCompletionChunk } from "openai/resources/chat";
import { Stream } from "openai/streaming";

export type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  gentraceConfig: GentraceConfiguration;
};

type ChatCompletionRequestMessageTemplate = Omit<
  Chat.ChatCompletionMessageParam,
  "content"
> & {
  content?: string;
  contentTemplate?: string;
  contentInputs?: Record<string, string>;
};

function createRenderedChatMessages(
  messages: ChatCompletionRequestMessageTemplate[],
) {
  let newMessages: Chat.ChatCompletionMessageParam[] = [];
  for (let message of messages) {
    if (message.contentTemplate && message.contentInputs) {
      const { contentTemplate, contentInputs, ...rest } = message;
      newMessages.push({
        ...rest,
        content: Mustache.render(contentTemplate, contentInputs),
      } as Chat.ChatCompletionMessageParam);
    } else if (message.content) {
      newMessages.push({
        ...message,
      } as Chat.ChatCompletionMessageParam);
    }
  }

  return newMessages;
}

export class GentraceStream<Item> implements AsyncIterable<Item> {
  constructor(
    private stream: Stream<Item>,
    private pipelineRun: PipelineRun,
    private partialStepRun: StepRun,
    private isSelfContained: boolean,
    private aggregator: (streamList: any[]) => Record<string, any>,
  ) {}

  async *[Symbol.asyncIterator](): AsyncIterator<Item, any, undefined> {
    const allItems: Item[] = [];

    for await (const item of this.stream) {
      // Yield each item from the original stream
      yield item;

      allItems.push(item);
    }

    const consolidatedResponse = this.aggregator(allItems);

    const endTime = Date.now();

    const elapsedTime = endTime - Date.parse(this.partialStepRun.startTime);

    this.partialStepRun.elapsedTime = elapsedTime;
    this.partialStepRun.endTime = new Date(endTime).toISOString();

    this.partialStepRun.outputs = consolidatedResponse;

    this.pipelineRun?.addStepRunNode(this.partialStepRun);

    if (this.isSelfContained) {
      await this.pipelineRun.submit();
    }
  }
}

export class GentraceEmbeddings extends OpenAI.Embeddings {
  private pipelineRun?: PipelineRun;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  async createInner(
    body: EmbeddingCreateParams & { pipelineSlug?: string; gentrace?: Context },
    options?: RequestOptions,
  ): Promise<CreateEmbeddingResponse & { pipelineRunId?: string }> {
    const { pipelineSlug, gentrace, ...newPayload } = body;
    const { model, ...inputParams } = newPayload;

    let isSelfContainedPullRequest = !this.pipelineRun && pipelineSlug;

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

    const startTime = Date.now();

    const completion = (await this._client.post("/embeddings", {
      body: newPayload,
      ...options,
    })) as never as CreateEmbeddingResponse;

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    pipelineRun?.addStepRunNode(
      new OpenAICreateEmbeddingStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        { ...inputParams },
        { model },
        completion,
        body?.gentrace ?? {},
      ),
    );

    if (isSelfContainedPullRequest) {
      const { pipelineRunId } = await pipelineRun.submit();
      (completion as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return completion as CreateEmbeddingResponse & { pipelineRunId: string };
    }

    return completion;
  }
}

export class GentraceModerations extends OpenAI.Moderations {
  private pipelineRun?: PipelineRun;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  async createInner(
    body: ModerationCreateParams & {
      pipelineSlug?: string;
      gentrace?: Context;
    },
    options?: RequestOptions,
  ): Promise<ModerationCreateResponse & { pipelineRunId?: string }> {
    const { pipelineSlug, gentrace, ...newPayload } = body;
    const { model, ...inputParams } = newPayload;

    let isSelfContainedPullRequest = !this.pipelineRun && pipelineSlug;

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

    const startTime = Date.now();

    const completion = (await this._client.post("/moderations", {
      body: newPayload,
      ...options,
    })) as never as ModerationCreateResponse;

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    pipelineRun?.addStepRunNode(
      new OpenAICreateModerationStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        { ...inputParams },
        { model },
        completion,
        body?.gentrace ?? {},
      ),
    );

    if (isSelfContainedPullRequest) {
      const { pipelineRunId } = await pipelineRun.submit();
      (completion as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return completion as ModerationCreateResponse & { pipelineRunId: string };
    }

    return completion;
  }
}

export interface GentraceChatCompletionCreateParams
  extends Omit<Chat.CompletionCreateParams, "messages"> {
  messages: Array<ChatCompletionRequestMessageTemplate>;
  pipelineSlug?: string;
  gentrace?: Context;
}

export interface GentraceChatCompletionCreateParamsStreaming
  extends GentraceChatCompletionCreateParams {
  stream: true;
}

export interface GentraceChatCompletionCreateParamsNonStreaming
  extends GentraceChatCompletionCreateParams {
  stream?: false | null;
}

export type GentraceChatCompletion = ChatCompletion & {
  pipelineRunId?: string;
};

export class GentraceChatCompletions extends OpenAI.Chat.Completions {
  private pipelineRun?: PipelineRun;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  // @ts-ignore
  async createInner(
    body: GentraceChatCompletionCreateParams,
    requestOptions?: RequestOptions,
  ): Promise<
    | GentraceChatCompletion
    | (GentraceStream<ChatCompletionChunk> & {
        pipelineRunId?: string;
      })
  > {
    const { pipelineSlug } = body;
    let isSelfContainedPipelineRun = !this.pipelineRun && !!pipelineSlug;

    let pipelineRun = this.pipelineRun;

    if (isSelfContainedPipelineRun) {
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

    const {
      messages,
      pipelineSlug: _pipelineSlug,
      gentrace,
      ...baseCompletionOptions
    } = body;

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

    const completion = this._client.post("/chat/completions", {
      body: { messages: renderedMessages, ...baseCompletionOptions },
      ...requestOptions,
      stream: body.stream ?? false,
    }) as APIPromise<ChatCompletion> | APIPromise<Stream<ChatCompletionChunk>>;

    const data = await completion;

    let finalData = data as
      | ChatCompletion
      | GentraceStream<ChatCompletionChunk>;

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    // user parameter is an input, not a model parameter
    const { user, ...modelParams } = baseCompletionOptions;

    if (body.stream) {
      finalData = new GentraceStream(
        data as Stream<ChatCompletionChunk>,
        pipelineRun,
        new OpenAICreateChatCompletionStepRun(
          0,
          new Date(startTime).toISOString(),
          "",
          {
            messages: renderedMessages,
            user,
            contentInputs: contentInputsArray,
          },
          { ...modelParams, contentTemplates: contentTemplatesArray },
          finalData,
          body?.gentrace ?? {},
        ),
        !!isSelfContainedPipelineRun,
        createChatCompletionStreamResponse,
      );
    } else {
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
          body?.gentrace ?? {},
        ),
      );
    }

    if (isSelfContainedPipelineRun) {
      let pipelineRunId = "";

      if (!body.stream) {
        const submitInfo = await pipelineRun.submit();
        pipelineRunId = submitInfo.pipelineRunId;
      } else {
        pipelineRunId = pipelineRun.getId();
      }

      (finalData as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return finalData as
        | GentraceChatCompletion
        | (GentraceStream<ChatCompletionChunk> & {
            pipelineRunId?: string;
          });
    }

    return finalData as
      | GentraceChatCompletion
      | (GentraceStream<ChatCompletionChunk> & {
          pipelineRunId?: string;
        });
  }
}

export interface GentraceCompletionCreateParams
  extends Omit<CompletionCreateParams, "prompt"> {
  prompt?: string | Array<string> | Array<number> | Array<Array<number>> | null;
  promptTemplate?: string;
  promptInputs: Record<string, string>;
  pipelineSlug?: string;
  gentrace?: Context;
}

export interface GentraceCompletionCreateParamsStreaming
  extends GentraceCompletionCreateParams {
  stream: true;
}

export interface GentraceCompletionCreateParamsNonStreaming
  extends GentraceCompletionCreateParams {
  stream?: false | null;
}

export type GentraceCompletion = Completion & {
  pipelineRunId?: string;
};

export class GentraceCompletions extends OpenAI.Completions {
  private pipelineRun?: PipelineRun;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  async createInner(
    body: GentraceCompletionCreateParams,
    requestOptions?: RequestOptions,
  ): Promise<
    | GentraceCompletion
    | (GentraceStream<Completion> & {
        pipelineRunId?: string;
      })
  > {
    const { pipelineSlug } = body;
    let isSelfContainedPipelineRun = !this.pipelineRun && !!pipelineSlug;

    let pipelineRun = this.pipelineRun;

    if (isSelfContainedPipelineRun) {
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

    const {
      promptTemplate,
      promptInputs,
      prompt,
      pipelineSlug: _pipelineSlug,
      gentrace,
      ...baseCompletionOptions
    } = body;

    let renderedPrompt = prompt;

    if (promptTemplate && promptInputs) {
      renderedPrompt = Mustache.render(promptTemplate, promptInputs);
    }

    const newCompletionOptions: CompletionCreateParams = {
      ...baseCompletionOptions,
      prompt: renderedPrompt,
      stream: baseCompletionOptions.stream ?? false,
    };

    const startTime = Date.now();
    const completion = this._client.post("/completions", {
      body: newCompletionOptions,
      ...requestOptions,
      stream: body.stream ?? false,
    }) as APIPromise<Completion> | APIPromise<Stream<Completion>>;

    const data = await completion;

    let finalData = data as Completion | GentraceStream<Completion>;

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    // User and suffix parameters are inputs not model parameters
    const { user, suffix, ...partialModelParams } = baseCompletionOptions;

    if (body.stream) {
      finalData = new GentraceStream(
        data as Stream<Completion>,
        pipelineRun,
        new OpenAICreateCompletionStepRun(
          0,
          new Date(startTime).toISOString(),
          "",
          {
            prompt: promptTemplate && promptInputs ? promptInputs : prompt,
            user,
            suffix,
          },
          { ...partialModelParams, promptTemplate },
          finalData,
          body?.gentrace ?? {},
        ),
        !!isSelfContainedPipelineRun,
        createCompletionStreamResponse,
      );
    } else {
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
          body?.gentrace ?? {},
        ),
      );
    }

    if (isSelfContainedPipelineRun) {
      let pipelineRunId = "";

      if (!body.stream) {
        const submitInfo = await pipelineRun.submit();
        pipelineRunId = submitInfo.pipelineRunId;
      } else {
        pipelineRunId = pipelineRun.getId();
      }

      (finalData as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return finalData as
        | GentraceCompletion
        | (GentraceStream<Completion> & {
            pipelineRunId?: string;
          });
    }

    return finalData as
      | GentraceCompletion
      | (GentraceStream<Completion> & {
          pipelineRunId?: string;
        });
  }
}

export type GentraceClientOptions = ClientOptions & {
  gentraceApiKey?: string;
  gentraceBasePath?: string;
  gentraceLogger?: {
    info: (message: string, context?: any) => void;
    warn: (message: string | Error, context?: any) => void;
  };
};

export class OpenAIPipelineHandler extends OpenAI {
  protected config: GentraceClientOptions;
  protected pipelineRun?: PipelineRun;
  protected gentraceConfig: GentraceConfiguration;

  constructor({
    pipelineRun,
    gentraceConfig,
    ...config
  }: ClientOptions & OpenAIPipelineHandlerOptions) {
    super(config);

    this.config = config;
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }
}

export class OpenAICreateChatCompletionStepRun extends StepRun {
  public modelParams: Omit<Chat.CompletionCreateParams, "messages" | "user">;
  public inputs: {
    messages?: Array<Chat.CreateChatCompletionRequestMessage>;
    user?: string;
  };

  public response:
    | OpenAI.Chat.Completions.ChatCompletion
    | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: {
      messages?: Array<Chat.CreateChatCompletionRequestMessage>;
      user?: string;
      contentInputs?: Record<string, string>[];
    },
    modelParams: Omit<Chat.CompletionCreateParams, "messages" | "user"> & {
      contentTemplates?: string[];
    },
    response:
      | OpenAI.Chat.Completions.ChatCompletion
      | GentraceStream<OpenAI.Chat.Completions.ChatCompletionChunk>,
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

export class OpenAICreateCompletionStepRun extends StepRun {
  public inputs: {
    prompt?: Record<string, string>;
    user?: string;
    suffix?: string;
  };
  public modelParams: Omit<
    CompletionCreateParams,
    "prompt" | "user" | "suffix"
  > & {
    promptTemplate: string;
  };
  public response: Completion | Stream<Completion>;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: {
      prompt?: Record<string, string> | string | any[];
      user?: string;
      suffix?: string;
    },
    modelParams: Omit<CompletionCreateParams, "prompt" | "user" | "suffix"> & {
      promptTemplate: string;
    },
    response: Completion | GentraceStream<Completion>,
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

export class OpenAICreateEmbeddingStepRun extends StepRun {
  public inputs: Omit<EmbeddingCreateParams, "model">;
  public modelParams: Omit<EmbeddingCreateParams, "input" | "user">;
  public response: CreateEmbeddingResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<EmbeddingCreateParams, "model">,
    modelParams: Omit<EmbeddingCreateParams, "input" | "user">,
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

export class OpenAICreateModerationStepRun extends StepRun {
  public inputs: Omit<ModerationCreateParams, "model">;
  public modelParams: Omit<ModerationCreateParams, "input" | "user">;
  public response: ModerationCreateResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<ModerationCreateParams, "model">,
    modelParams: Omit<ModerationCreateParams, "input" | "user">,
    response: ModerationCreateResponse,
    context: Context,
  ) {
    super(
      "openai",
      "openai_createModeration",
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

function createChatCompletionStreamResponse(streamList: StreamDelta[]) {
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

  const finalResponse: Record<string, any> = {
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

interface Choice {
  text?: string;
  delta?: {
    content?: string;
  };
  index?: number;
  finish_reason?: string;
}

interface StreamDelta {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
}

function createCompletionStreamResponse(streamList: StreamDelta[]) {
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

  const finalResponse: Record<string, any> = {
    id,
    // Override this so it doesn't show chat.completion.chunk.
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
