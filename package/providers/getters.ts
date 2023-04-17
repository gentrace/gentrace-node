import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../configuration";

export async function getOpenAI({
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
