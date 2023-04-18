import type { Configuration as OpenAIConfiguration } from "openai/dist/configuration";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { OpenAIPipelineHandler } from "../llms/openai";

export function openai({
  gentraceApiKey,
  gentraceBasePath,
  config,
}: {
  gentraceApiKey: string;
  gentraceBasePath?: string;
  config?: OpenAIConfiguration;
}) {
  try {
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
