import { MetadataValueObject } from "../models";

type PipelineRunContext = {
  userId?: string;
  metadata?: { [key: string]: MetadataValueObject };
};

export type CoreStepRunContext = {
  render?: {
    type: "html";
    key: string;
  };
  metadata?: { [key: string]: MetadataValueObject };
};

export type PluginContext = PipelineRunContext;
export type PluginStepRunContext = Record<string, never>;
export type Context = PipelineRunContext & CoreStepRunContext;
