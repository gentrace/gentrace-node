import { Configuration as GentraceConfiguration } from "../../configuration";
import { PineconeConfiguration } from "../pipeline";
import { PineconePipelineHandler } from "../vectorstores/pinecone";

export async function pinecone({
  gentraceApiKey,
  gentraceBasePath,
  config,
}: {
  gentraceApiKey: string;
  gentraceBasePath?: string;
  config?: PineconeConfiguration;
}) {
  try {
    const pineconeHandler = new PineconePipelineHandler({
      gentraceConfig: new GentraceConfiguration({
        apiKey: gentraceApiKey,
        basePath: gentraceBasePath,
      }),
      config,
    });
    return pineconeHandler;
  } catch (e) {
    throw new Error(
      "Please install Pinecone as a dependency with, e.g. `yarn add pinecone`"
    );
  }
}
