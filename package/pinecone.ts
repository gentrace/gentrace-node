import { Configuration as GentraceConfiguration } from "./configuration";
import { globalGentraceConfig } from "./providers/init";
import { PineconePipelineHandler } from "./providers/vectorstores/pinecone";

class PineconeClient extends PineconePipelineHandler {
  constructor({
    gentraceApiKey,
    gentraceBasePath,
  }: {
    /**
     * @deprecated Declare the API key in the init() call instead.
     */
    gentraceApiKey?: string;
    /**
     * @deprecated Declare the base path in the init() call instead.
     */
    gentraceBasePath?: string;
  }) {
    let gentraceConfig: GentraceConfiguration | null = null;

    if (gentraceApiKey) {
      gentraceConfig = new GentraceConfiguration({
        apiKey: gentraceApiKey,
        basePath: gentraceBasePath,
      });
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      gentraceConfig,
    });
  }
}

export { PineconeClient };
