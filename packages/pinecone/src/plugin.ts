import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
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
  const pureClient = new PurePineconeClient();
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
    private pureClient: PurePineconeClient,
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
    const advancedClient = new AdvancedPineconeClient({
      pipelineRun,
      gentraceConfig,
      config: this.config,
    });

    // @ts-ignore: Hack to ignore prototype patching. Two prototype hops are necessary:
    // AdvancedPineconeClient -> PineconePipelineHandler -> PineconeClient.
    advancedClient.__proto__.__proto__ = this.pureClient;

    return advancedClient;
  }
}
