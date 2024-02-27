import { MetadataValueObject } from "../models";

type Metadata = {
  [key: string]: MetadataValueObject;
};

type PipelineRunContext = {
  userId?: string;
  metadata?: Metadata;
  previousRunId?: string | null;
};

export type CoreStepRunContext = {
  render?: {
    type: "html";
    key: string;
  };
  metadata?: Metadata;
};

export type PluginContext = PipelineRunContext;
export type PluginStepRunContext = { metadata?: Metadata };
export type ResultContext = { name?: string; metadata?: Metadata };
export type Context = PipelineRunContext & CoreStepRunContext;
