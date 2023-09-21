type PipelineRunContext = {
  userId?: string;
};

export type CoreStepRunContext = {
  render?: {
    type: "html";
    key: string;
  };
};

export type PluginContext = PipelineRunContext;
export type PluginStepRunContext = Record<string, never>;
export type Context = PipelineRunContext & CoreStepRunContext;
