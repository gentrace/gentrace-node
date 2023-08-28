// @ts-ignore: the typings from @types/mustache are incorrect
import Mustache from "mustache";
import OpenAI, { ClientOptions } from "openai";
import { APIPromise, RequestOptions } from "openai/core";
import {
  Chat,
  Completion,
  CompletionCreateParams,
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
} from "openai/resources";
import {
  ChatCompletion,
  ChatCompletionChunk,
  CreateChatCompletionRequestMessage,
} from "openai/resources/chat";
import { Stream } from "openai/streaming";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { Pipeline } from "../pipeline";
import { PipelineRun } from "../pipeline-run";
import { StepRun } from "../step-run";

type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  pipeline?: Pipeline;
  gentraceConfig: GentraceConfiguration;
};

type ChatCompletionRequestMessageTemplate = Omit<
  Chat.CreateChatCompletionRequestMessage,
  "content"
> & {
  content?: string;
  contentTemplate?: string;
  contentInputs?: Record<string, string>;
};

function createRenderedChatMessages(
  messages: ChatCompletionRequestMessageTemplate[]
) {
  let newMessages: Chat.CreateChatCompletionRequestMessage[] = [];
  for (let message of messages) {
    if (message.contentTemplate && message.contentInputs) {
      const { contentTemplate, contentInputs, ...rest } = message;
      newMessages.push({
        ...rest,
        content: Mustache.render(contentTemplate, contentInputs),
      });
    } else if (message.content) {
      newMessages.push({
        ...message,
      } as Chat.CreateChatCompletionRequestMessage);
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
    private aggregator: (streamList: any[]) => Record<string, any>
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

class GentraceEmbeddings extends OpenAI.Embeddings {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    pipeline,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    pipeline?: Pipeline;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;
  }

  // @ts-ignore
  async create(
    body: EmbeddingCreateParams & { pipelineSlug?: string },
    options?: RequestOptions
  ): Promise<CreateEmbeddingResponse & { pipelineRunId?: string }> {
    const { pipelineSlug, ...newPayload } = body;
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

    const completion = (await this.post("/embeddings", {
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
        completion
      )
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

interface GentraceChatCompletionCreateParams
  extends Omit<Chat.CompletionCreateParams, "messages"> {
  messages: Array<ChatCompletionRequestMessageTemplate>;
  pipelineSlug?: string;
}

interface GentraceChatCompletionCreateParamsStreaming
  extends GentraceChatCompletionCreateParams {
  stream: true;
}

interface GentraceChatCompletionCreateParamsNonStreaming
  extends GentraceChatCompletionCreateParams {
  stream?: false | null;
}

type GentraceChatCompletion = ChatCompletion & {
  pipelineRunId?: string;
};

type GentraceChatCompletionChunk = ChatCompletionChunk & {
  pipelineRunId?: string;
};

class GentraceChatCompletions extends OpenAI.Chat.Completions {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    pipeline,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    pipeline?: Pipeline;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;
  }

  // @ts-ignore
  create(
    body: GentraceChatCompletionCreateParamsNonStreaming,
    options?: RequestOptions
  ): Promise<GentraceChatCompletion>;

  // @ts-ignore
  create(
    body: GentraceChatCompletionCreateParamsStreaming,
    options?: RequestOptions
  ): Promise<
    GentraceStream<ChatCompletionChunk> & {
      pipelineRunId?: string;
    }
  >;

  // @ts-ignore
  async create(
    body: GentraceChatCompletionCreateParams,
    requestOptions?: RequestOptions
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
      ...baseCompletionOptions
    } = body;

    const renderedMessages = createRenderedChatMessages(messages);

    const contentTemplatesArray = messages.map<string | null>((message) => {
      return message.contentTemplate ?? null;
    });

    const contentInputsArray = messages.map<Record<string, string> | null>(
      (message) => {
        return message.contentInputs ?? null;
      }
    );
    const startTime = Date.now();

    const completion = this.post("/chat/completions", {
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
          finalData
        ),
        !!isSelfContainedPipelineRun,
        createChatCompletionStreamResponse
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
          finalData
        )
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

class GentraceChat extends OpenAI.Chat {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  // @ts-ignore
  public completions: GentraceChatCompletions;

  constructor({
    client,
    pipelineRun,
    pipeline,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    pipeline?: Pipeline;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;

    // @ts-ignore
    this.completions = new GentraceChatCompletions({
      // @ts-ignore
      client,
      pipelineRun,
      pipeline,
      gentraceConfig,
    });
  }
}

interface GentraceCompletionCreateParams
  extends Omit<CompletionCreateParams, "prompt"> {
  prompt?: string | Array<string> | Array<number> | Array<Array<number>> | null;
  promptTemplate?: string;
  promptInputs: Record<string, string>;
  pipelineSlug?: string;
}

interface GentraceCompletionCreateParamsStreaming
  extends GentraceCompletionCreateParams {
  stream: true;
}

interface GentraceCompletionCreateParamsNonStreaming
  extends GentraceCompletionCreateParams {
  stream?: false | null;
}

type GentraceCompletion = Completion & {
  pipelineRunId?: string;
};

class GentraceCompletions extends OpenAI.Completions {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  constructor({
    client,
    pipelineRun,
    pipeline,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    pipeline?: Pipeline;
    gentraceConfig: GentraceConfiguration;
  }) {
    super(client);
    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;
  }

  // @ts-ignore
  create(
    body: GentraceCompletionCreateParamsNonStreaming,
    options?: RequestOptions
  ): Promise<GentraceCompletion>;

  // @ts-ignore
  create(
    body: GentraceCompletionCreateParamsStreaming,
    options?: RequestOptions
  ): Promise<
    GentraceStream<Completion> & {
      pipelineRunId?: string;
    }
  >;

  // @ts-ignore
  async create(
    body: GentraceCompletionCreateParams,
    requestOptions?: RequestOptions
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
      ...baseCompletionOptions
    } = body;

    let renderedPrompt = prompt;

    if (promptTemplate && promptInputs) {
      renderedPrompt = Mustache.render(promptTemplate, promptInputs);
    }

    const newCompletionOptions: CompletionCreateParams = {
      ...baseCompletionOptions,
      prompt: renderedPrompt,
    };

    const startTime = Date.now();
    const completion = this.post("/completions", {
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
          finalData
        ),
        !!isSelfContainedPipelineRun,
        createCompletionStreamResponse
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
          finalData
        )
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
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  // @ts-ignore
  completions: GentraceCompletions;

  // @ts-ignore
  chat: GentraceChat;

  // @ts-ignore
  embeddings: GentraceEmbeddings;

  constructor({
    pipelineRun,
    pipeline,
    gentraceConfig,
    ...oaiOptions
  }: ClientOptions & OpenAIPipelineHandlerOptions) {
    super(oaiOptions);

    this.pipelineRun = pipelineRun;
    this.pipeline = pipeline;
    this.gentraceConfig = gentraceConfig;

    // @ts-ignore
    this.completions = new GentraceCompletions({
      // @ts-ignore
      client: this,
      pipelineRun,
      pipeline,
      gentraceConfig,
    });

    // @ts-ignore
    this.chat = new GentraceChat({
      // @ts-ignore
      client: this,
      pipelineRun,
      pipeline,
      gentraceConfig,
    });

    this.embeddings = new GentraceEmbeddings({
      // @ts-ignore
      client: this,
      pipelineRun,
      pipeline,
      gentraceConfig,
    });
  }

  public setPipelineRun(pipelineRun: PipelineRun) {
    this.pipelineRun = pipelineRun;
  }

  public setPipeline(pipeline: Pipeline) {
    this.pipeline = pipeline;
  }
}

class OpenAICreateChatCompletionStepRun extends StepRun {
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
      | GentraceStream<OpenAI.Chat.Completions.ChatCompletionChunk>
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

class OpenAICreateCompletionStepRun extends StepRun {
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
    response: Completion | GentraceStream<Completion>
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

class OpenAICreateEmbeddingStepRun extends StepRun {
  public inputs: Omit<EmbeddingCreateParams, "model">;
  public modelParams: Omit<EmbeddingCreateParams, "input" | "user">;
  public response: CreateEmbeddingResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<EmbeddingCreateParams, "model">,
    modelParams: Omit<EmbeddingCreateParams, "input" | "user">,
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
