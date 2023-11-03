import {
  PluginStepRunContext,
  Configuration as GentraceConfiguration,
  Context,
  PipelineRun,
} from "@gentrace/core";
import OpenAI from "openai";
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

type OpenAIPipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  gentraceConfig: GentraceConfiguration;
};

class AdvancedOpenAI extends OpenAIPipelineHandler {
  // @ts-ignore
  completions: AdvancedGentraceCompletions;

  // @ts-ignore
  chat: AdvancedGentraceChat;

  // @ts-ignore
  embeddings: AdvancedGentraceEmbeddings;

  constructor(options: GentraceClientOptions & OpenAIPipelineHandlerOptions) {
    super({
      ...options,
    });

    // @ts-ignore
    this.completions = new AdvancedGentraceCompletions({
      // @ts-ignore
      client: this,
      ...options,
    });

    // @ts-ignore
    this.chat = new AdvancedGentraceChat({
      // @ts-ignore
      client: this,
      ...options,
    });

    this.embeddings = new AdvancedGentraceEmbeddings({
      // @ts-ignore
      client: this,
      ...options,
    });

    // @ts-ignore
    this.moderations = new AdvancedGentraceModerations({
      // @ts-ignore
      client: this,
      ...options,
    });
  }
}

class AdvancedGentraceEmbeddings extends GentraceEmbeddings {
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
      gentrace?: PluginStepRunContext;
    },
    options?: RequestOptions,
  ): Promise<CreateEmbeddingResponse & { pipelineRunId?: string }> {
    return super.createInner(body, options);
  }
}

class AdvancedGentraceModerations extends GentraceModerations {
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
      gentrace?: PluginStepRunContext;
    },
    options?: RequestOptions,
  ): Promise<ModerationCreateResponse & { pipelineRunId?: string }> {
    return super.createInner(body, options);
  }
}

export class AdvancedGentraceCompletions extends GentraceCompletions {
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
      gentrace?: PluginStepRunContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: PluginStepRunContext;
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
      gentrace?: PluginStepRunContext;
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

export class AdvancedGentraceChat extends OpenAI.Chat {
  // @ts-ignore
  public completions: AdvancedGentraceChatCompletions;

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
    this.completions = new AdvancedGentraceChatCompletions({
      // @ts-ignore
      client,
      pipelineRun,
      gentraceConfig,
    });
  }
}

class AdvancedGentraceChatCompletions extends GentraceChatCompletions {
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
      gentrace?: PluginStepRunContext;
    },
    options?: RequestOptions,
  ): Promise<GentraceChatCompletion>;

  // @ts-ignore
  create(
    body: Omit<GentraceChatCompletionCreateParamsStreaming, "gentrace"> & {
      gentrace?: PluginStepRunContext;
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
      gentrace?: PluginStepRunContext;
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

export { AdvancedOpenAI };
