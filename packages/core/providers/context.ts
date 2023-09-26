import { MetadataValueObject } from "../models";

type Metadata = {
  [key: string]: MetadataValueObject;
};

type PipelineRunContext = {
  userId?: string;
  metadata?: Metadata;
};

export type CoreStepRunContext = {
  render?: {
    type: "html";
    key: string;
  };
  metadata?: { [key: string]: MetadataValueObject };
};

export type PluginContext = PipelineRunContext;
export type PluginStepRunContext = { metadata?: Metadata };
export type Context = PipelineRunContext & CoreStepRunContext;
