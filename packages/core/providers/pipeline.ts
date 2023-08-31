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
  public config: GentraceConfiguration;
  public pipelineHandlers: Map<string, any> = new Map();

  constructor({
    slug,
    id,
    apiKey,
    basePath,
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
          "The apiKey parameter is deprecated. Please declare the API key in the init() call instead.",
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
    // TODO: Redo
  }

  start(context?: Pick<Context, "userId">) {
    return new PipelineRun({ pipeline: this, context });
  }
}
