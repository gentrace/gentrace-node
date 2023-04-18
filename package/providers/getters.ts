import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../configuration";
import { PineconeConfiguration } from "./pipeline";

export async function openai({
  gentraceApiKey,
  gentraceBasePath,
  config,
}: {
  gentraceApiKey: string;
  gentraceBasePath?: string;
  config?: OpenAIConfiguration;
}) {
  try {
    const { OpenAIPipelineHandler } = await import("./llms/openai");
    const openAIHandler = new OpenAIPipelineHandler({
      gentraceConfig: new GentraceConfiguration({
        apiKey: gentraceApiKey,
        basePath: gentraceBasePath,
      }),
      config,
    });
    return openAIHandler;
  } catch (e) {
    throw new Error(
      "Please install OpenAI as a dependency with, e.g. `yarn add openai`"
    );
  }
}

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
    const { PineconePipelineHandler } = await import("./vectorstores/pinecone");
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
