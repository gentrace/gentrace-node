import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../configuration";
import Context from "./context";
import { globalGentraceConfig } from "./init";
import { PipelineRun } from "./pipeline-run";

export type PineconeConfiguration = {
  apiKey: string;
  environment: string;
};

export class Pipeline {
  public id: string;
  public slug: string;
  public pineconeConfig: PineconeConfiguration;
  public openAIConfig: OpenAIConfiguration;
  public config: GentraceConfiguration;
  public pipelineHandlers: Map<string, any> = new Map();

  constructor({
    slug,
    id,
    apiKey,
    basePath,
    openAIConfig,
    pineconeConfig,
    logger,
  }: {
    slug?: string;

    /**
     * @deprecated Use the "slug" parameter instead
     */
    id?: string;

    /**
     * @deprecated Declare the API key in the init() call instead.
     */
    apiKey?:
      | string
      | Promise<string>
      | ((name: string) => string)
      | ((name: string) => Promise<string>);
    /**
     * @deprecated Declare the base path in the init() call instead.
     */
    basePath?: string;
    openAIConfig?: OpenAIConfiguration;
    pineconeConfig?: PineconeConfiguration;
    logger?: {
      info: (message: string, context?: any) => void;
      warn: (message: string | Error, context?: any) => void;
    };
  }) {
    this.id = id;
    this.slug = slug;

    if (!slug && !id) {
      throw new Error("Please provide the Pipeline slug");
    }

    if (!globalGentraceConfig) {
      throw new Error("Please call init() before instantiating a Pipeline");
    }

    if (apiKey) {
      if (logger) {
        logger.warn(
          "The apiKey parameter is deprecated. Please declare the API key in the init() call instead."
        );
      }
      this.config = new GentraceConfiguration({
        apiKey,
        basePath,
        logger,
      });
    } else {
      this.config = globalGentraceConfig;
    }

    this.openAIConfig = openAIConfig;
    this.pineconeConfig = pineconeConfig;
  }

  getLogger() {
    return this.config.logger;
  }

  logInfo(message: string) {
    const logger = this.getLogger();
    if (logger) {
      logger.info(message);
    }
  }

  logWarn(e: Error | string) {
    const logger = this.getLogger();
    if (logger) {
      logger.warn(e);
    } else {
      // By default, we print to STDERR.
      console.warn(e);
    }
  }

  /**
   * Setup the pipeline by initializing the pipeline handlers for all provider handlers
   */
  async setup() {
    if (this.pineconeConfig) {
      try {
        const { PineconePipelineHandler } = await import(
          "../handlers/vectorstores/pinecone.js"
        );
        const pineconeHandler = new PineconePipelineHandler({
          pipeline: this,
          config: this.pineconeConfig,
          gentraceConfig: this.config,
        });
        await pineconeHandler.init();
        this.pipelineHandlers.set("pinecone", pineconeHandler);
      } catch (e) {
        throw new Error(
          "Please install Pinecone as a dependency with, e.g. `yarn add @pinecone-database/pinecone`"
        );
      }
    }

    if (this.openAIConfig) {
      try {
        const { AdvancedOpenAIApi } = await import("./advanced/openai.js");
        const openAIHandler = new AdvancedOpenAIApi({
          pipeline: this,
          config: this.openAIConfig,
          gentraceConfig: this.config,
        });
        this.pipelineHandlers.set("openai", openAIHandler);
      } catch (e) {
        console.error('Error importing "openai" package', e);
        throw new Error(
          "Please install OpenAI as a dependency with, e.g. `yarn add openai`"
        );
      }
    }
  }

  start(context?: Context) {
    return new PipelineRun({ pipeline: this, context });
  }
}
