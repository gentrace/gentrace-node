import {
  Configuration as GentraceConfiguration,
  GentracePlugin,
  globalGentraceConfig,
  InitPluginFunction,
  isConfig,
  PipelineRun,
} from "@gentrace/core";
import { AdvancedPineconeClient } from "./handlers/advanced";
import { PineconeConfiguration } from "./pinecone";

export const initPlugin: InitPluginFunction<
  PineconeConfiguration,
  AdvancedPineconeClient
> = async (configOrSimpleHandler) => {
  if (isConfig(configOrSimpleHandler)) {
    const pureClient = new AdvancedPineconeClient({
      config: configOrSimpleHandler,
      gentraceConfig: globalGentraceConfig,
    });
    await pureClient.init({
      apiKey: configOrSimpleHandler.apiKey,
      environment: configOrSimpleHandler.environment,
    });
    return new PineconePlugin(configOrSimpleHandler, pureClient);
  }

  const pureClient = new AdvancedPineconeClient({
    config: configOrSimpleHandler.getConfig(),
    gentraceConfig: globalGentraceConfig,
  });

  const extractedConfig = configOrSimpleHandler.getConfig();
  await pureClient.init(extractedConfig);
  return new PineconePlugin(extractedConfig, pureClient);
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
