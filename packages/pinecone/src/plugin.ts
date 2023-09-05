import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  globalGentraceConfig,
  InitPluginFunction,
  PipelineRun,
} from "@gentrace/core";
import { PineconeClient as PurePineconeClient } from "@pinecone-database/pinecone";
import { AdvancedPineconeClient } from "./handlers/advanced";
import { PineconeConfiguration } from "./pinecone";

export const initPlugin: InitPluginFunction<
  PineconeConfiguration,
  AdvancedPineconeClient
> = async (config: PineconeConfiguration) => {
  const pureClient = new AdvancedPineconeClient({
    config,
    gentraceConfig: globalGentraceConfig,
  });
  await pureClient.init({
    apiKey: config.apiKey,
    environment: config.environment,
  });
  return new PineconePlugin(config, pureClient);
};

export class PineconePlugin extends GentracePlugin<
  PineconeConfiguration,
  AdvancedPineconeClient
> {
  constructor(
    public config: PineconeConfiguration,
    private pureClient: AdvancedPineconeClient,
  ) {
    super();
  }

  getConfig(): PineconeConfiguration {
    return this.config;
  }

  async auth<T>(): Promise<T> {
    return;
  }

  advanced({
    pipelineRun,
    gentraceConfig,
  }: {
    pipelineRun: PipelineRun;
    gentraceConfig: GentraceConfiguration;
  }): AdvancedPineconeClient {
    // Hack to allow initialization in the initPlugin() function
    const clonedHandler = Object.create(
      this.pureClient,
    ) as AdvancedPineconeClient;

    const advancedClientPrototype = Object.create(
      Object.getPrototypeOf(clonedHandler),
    );

    const handlerPrototype = Object.create(
      Object.getPrototypeOf(advancedClientPrototype),
    );

    advancedClientPrototype.__proto__ = handlerPrototype;

    clonedHandler.setPipelineRun(pipelineRun);

    return clonedHandler;
  }
}
