// @ts-ignore: the typings from @types/mustache are incorrect
import Mustache from "mustache";
import OpenAI, { ClientOptions } from "openai";
import { APIPromise, RequestOptions } from "openai/core";
import { Chat, Completion, CompletionCreateParams } from "openai/resources";
import { ChatCompletion, ChatCompletionChunk } from "openai/resources/chat";
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

class GentraceChatCompletions extends OpenAI.Chat.Completions {
  private pipelineRun?: PipelineRun;
  private pipeline?: Pipeline;
  private gentraceConfig: GentraceConfiguration;

  // @ts-ignore
  async create(
    body: Chat.CompletionCreateParams & {
      messages: Array<ChatCompletionRequestMessageTemplate>;
      pipelineSlug?: string;
    },
    requestOptions?: RequestOptions
  ) {
    const { pipelineSlug } = body;
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

    const {
      messages,
      pipelineSlug: _pipelineSlug,
      ...baseCompletionOptions
    } = body;

    const renderedMessages = createRenderedChatMessages(messages);

    const startTime = Date.now();

    const completion = this.post("/chat/completions", {
      body: { messages: renderedMessages, ...baseCompletionOptions },
      ...requestOptions,
      stream: body.stream ?? false,
    }) as APIPromise<ChatCompletion> | APIPromise<Stream<ChatCompletionChunk>>;

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    const data = await completion;

    // user parameter is an input, not a model parameter
    const { user, ...modelParams } = baseCompletionOptions;

    pipelineRun?.addStepRunNode(
      new OpenAICreateChatCompletionStepRun(
        elapsedTime,
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        { messages: renderedMessages, user },
        modelParams,
        data
      )
    );

    if (isSelfContainedPullRequest) {
      const { pipelineRunId } = await pipelineRun.submit();
      (data as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return data as
        | (Completion & { pipelineRunId: string })
        | (Stream<Completion> & { pipelineRunId: string });
    }
    return data;
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
      client: this,
      pipelineRun,
      pipeline,
      gentraceConfig,
    });
  }
}

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
  async create(
    body: CompletionCreateParams & {
      prompt?:
        | string
        | Array<string>
        | Array<number>
        | Array<Array<number>>
        | null;
      promptTemplate?: string;
      promptInputs: Record<string, string>;
      pipelineSlug?: string;
    },
    requestOptions?: RequestOptions
  ) {
    const { pipelineSlug } = body;
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

    const endTime = Date.now();

    const elapsedTime = Math.floor(endTime - startTime);

    const data = await completion;

    // User and suffix parameters are inputs not model parameters
    const { user, suffix, ...partialModelParams } = baseCompletionOptions;

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
        data
      )
    );

    if (isSelfContainedPullRequest) {
      const { pipelineRunId } = await pipelineRun.submit();
      (data as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return data as
        | (Completion & { pipelineRunId: string })
        | (Stream<Completion> & { pipelineRunId: string });
    }
    return data;
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

  // @ts-ignore:
  chat: GentraceChat;

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
    },
    modelParams: Omit<Chat.CompletionCreateParams, "messages" | "user">,
    response:
      | OpenAI.Chat.Completions.ChatCompletion
      | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>
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
    response: Completion | Stream<Completion>
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
