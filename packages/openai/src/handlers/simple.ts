import {
  Configuration as GentraceConfiguration,
  GENTRACE_API_KEY,
  globalGentraceConfig,
  PipelineRun,
  PluginContext,
  SimpleHandler,
} from "@gentrace/core";
import OpenAI from "openai";
import {
  ChatCompletionParseParams,
  ParsedChatCompletion,
} from "openai/resources/beta/chat/completions";
import { RequestOptions } from "openai/core";
import {
  Completion,
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
  ModerationCreateParams,
  ModerationCreateResponse,
} from "openai/resources";
import { ChatCompletionChunk } from "openai/resources/chat";
import {
  GentraceBetaChatCompletions,
  GentraceChatCompletion,
  GentraceChatCompletionCreateParams,
  GentraceChatCompletionCreateParamsNonStreaming,
  GentraceChatCompletionCreateParamsStreaming,
  GentraceChatCompletions,
  GentraceClientOptions,
  GentraceCompletion,
  GentraceCompletionCreateParams,
  GentraceCompletionCreateParamsNonStreaming,
  GentraceCompletionCreateParamsStreaming,
  GentraceCompletions,
  GentraceEmbeddings,
  GentraceModerations,
  GentraceStream,
  OpenAIPipelineHandler,
} from "../openai";
import { ExtractParsedContentFromParams } from "openai/lib/parser";
import { Chat } from "openai/resources/beta/chat/chat";

class SimpleOpenAI
  extends OpenAIPipelineHandler
  implements SimpleHandler<GentraceClientOptions>
{
  // @ts-ignore
  beta: SimpleGentraceBeta;

  // @ts-ignore
  completions: SimpleGentraceCompletions;

  // @ts-ignore
  chat: SimpleGentraceChat;

  // @ts-ignore
  embeddings: SimpleGentraceEmbeddings;

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
        "Gentrace API key not provided. Please provide it in the init() call.",
      );
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      ...oaiOptions,
      gentraceConfig,
    });

    // @ts-ignore
    this.completions = new SimpleGentraceCompletions({
      // @ts-ignore
      client: this,
      ...options,
      gentraceConfig,
    });

    // @ts-ignore
    this.chat = new SimpleGentraceChat({
      // @ts-ignore
      client: this,
      ...options,
      gentraceConfig,
    });

    // @ts-ignore
    this.beta = new SimpleGentraceBeta({
      // @ts-ignore
      client: this,
      ...options,
      gentraceConfig,
    });

    // @ts-ignore
    this.moderations = new SimpleGentraceModerations({
      // @ts-ignore
      client: this,
      ...options,
      gentraceConfig,
    });

    this.embeddings = new SimpleGentraceEmbeddings({
      // @ts-ignore
      client: this,
      ...options,
      gentraceConfig,
    });
  }
  getConfig(): GentraceClientOptions {
    return this.config;
  }

  setPipelineRun(pipelineRun: PipelineRun): void {
    this.pipelineRun = pipelineRun;
  }
}

class SimpleGentraceEmbeddings extends GentraceEmbeddings {
  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super({
      client,
      gentraceConfig,
      pipelineRun,
    });
  }

  // @ts-ignore
  async create(
    body: EmbeddingCreateParams & {
      pipelineSlug?: string;
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<CreateEmbeddingResponse & { pipelineRunId?: string }> {
    return super.createInner(body, options);
  }
}

class SimpleGentraceModerations extends GentraceModerations {
  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super({
      client,
      gentraceConfig,
      pipelineRun,
    });
  }

  // @ts-ignore
  async create(
    body: ModerationCreateParams & {
      pipelineSlug?: string;
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<ModerationCreateResponse & { pipelineRunId?: string }> {
    return super.createInner(body, options);
  }
}

export class SimpleGentraceCompletions extends GentraceCompletions {
  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super({
      client,
      pipelineRun,
      gentraceConfig,
    });
  }

  // @ts-ignore
  create(
    body: Omit<GentraceCompletionCreateParamsNonStreaming, "gentrace"> & {
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<
    GentraceStream<Completion> & {
      pipelineRunId?: string;
    }
  >;

  // @ts-ignore
  async create(
    body: Omit<GentraceCompletionCreateParams, "gentrace"> & {
      gentrace?: PluginContext;
    },
    requestOptions?: RequestOptions,
  ): Promise<
    | GentraceCompletion
    | (GentraceStream<Completion> & {
        pipelineRunId?: string;
      })
  > {
    return super.createInner(body, requestOptions);
  }
}

export class SimpleGentraceBeta extends OpenAI.Beta {
  // @ts-ignore
  public chat: SimpleGentraceBetaChat;

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

    // @ts-ignore
    this.chat = new SimpleGentraceBetaChat({
      // @ts-ignore
      client,
      pipelineRun,
      gentraceConfig,
    });
  }
}

export class SimpleGentraceBetaChat extends Chat {
  // @ts-ignore
  public completions: SimpleGentraceBetaChatCompletions;

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

    // @ts-ignore
    this.completions = new SimpleGentraceBetaChatCompletions({
      // @ts-ignore
      client,
      pipelineRun,
      gentraceConfig,
    });
  }
}

class SimpleGentraceBetaChatCompletions extends GentraceBetaChatCompletions {
  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super({
      client,
      pipelineRun,
      gentraceConfig,
    });
  }

  // @ts-ignore
  async parse<
    Params extends ChatCompletionParseParams,
    ParsedT = ExtractParsedContentFromParams<Params>,
  >(
    body: GentraceChatCompletionCreateParams,
    options?: RequestOptions,
  ): Promise<ParsedChatCompletion<ParsedT>> {
    return super.parseInner(body, options);
  }
}

export class SimpleGentraceChat extends OpenAI.Chat {
  // @ts-ignore
  public completions: SimpleGentraceChatCompletions;

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

    // @ts-ignore
    this.completions = new SimpleGentraceChatCompletions({
      // @ts-ignore
      client,
      pipelineRun,
      gentraceConfig,
    });
  }
}

class SimpleGentraceChatCompletions extends GentraceChatCompletions {
  constructor({
    client,
    pipelineRun,
    gentraceConfig,
  }: {
    client: OpenAI;
    pipelineRun?: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }) {
    super({
      client,
      pipelineRun,
      gentraceConfig,
    });
  }

  // @ts-ignore
  create(
    body: Omit<GentraceChatCompletionCreateParamsNonStreaming, "gentrace"> & {
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceChatCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceChatCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: PluginContext;
    },
    options?: RequestOptions,
  ): Promise<
    GentraceStream<ChatCompletionChunk> & {
      pipelineRunId?: string;
    }
  >;

  // @ts-ignore
  async create(
    body: Omit<GentraceChatCompletionCreateParams, "gentrace"> & {
      gentrace?: PluginContext;
    },
    requestOptions?: RequestOptions,
  ): Promise<
    | GentraceChatCompletion
    | (GentraceStream<ChatCompletionChunk> & {
        pipelineRunId?: string;
      })
  > {
    return super.createInner(body, requestOptions);
  }
}

export { SimpleOpenAI };
