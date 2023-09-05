import {
  Configuration as GentraceConfiguration,
  Context,
  GENTRACE_API_KEY,
  globalGentraceConfig,
  PipelineRun,
  SimpleContext,
  SimpleHandler,
} from "@gentrace/core";
import OpenAI from "openai";
import { RequestOptions } from "openai/core";
import {
  Completion,
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
} from "openai/resources";
import { ChatCompletionChunk } from "openai/resources/chat";
import {
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
  GentraceStream,
  OpenAIPipelineHandler,
} from "../openai";

class SimpleOpenAI
  extends OpenAIPipelineHandler
  implements SimpleHandler<GentraceClientOptions>
{
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
      gentrace?: SimpleContext;
    },
    options?: RequestOptions,
  ): Promise<CreateEmbeddingResponse & { pipelineRunId?: string }> {
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
      gentrace?: SimpleContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: SimpleContext;
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
      gentrace?: SimpleContext;
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
      gentrace?: SimpleContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceChatCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceChatCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: SimpleContext;
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
      gentrace?: SimpleContext;
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
