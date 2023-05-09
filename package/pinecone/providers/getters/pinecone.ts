import { Configuration as GentraceConfiguration } from "../../configuration";
import { PineconePipelineHandler } from "../vectorstores/pinecone";

class PineconeClient extends PineconePipelineHandler {
  constructor({
    gentraceApiKey,
    gentraceBasePath,
  }: {
    gentraceApiKey: string;
    gentraceBasePath?: string;
  }) {
    super({
      gentraceConfig: new GentraceConfiguration({
        apiKey: gentraceApiKey,
        basePath: gentraceBasePath,
      }),
    });
  }
}

export { PineconeClient };
