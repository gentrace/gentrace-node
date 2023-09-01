export interface IGentracePlugin<S, A> {
  simple(): Promise<S>;

  advanced(): Promise<A>;
}

export abstract class GentracePlugin<S, A> implements IGentracePlugin<S, A> {
  abstract simple(): Promise<S>;

  abstract advanced(): Promise<A>;
}

export type InitPluginFunction<C extends object, S, A> = (
  config: C,
) => GentracePlugin<S, A>;

type OpenAIPluginSimple = {
  name: string;
  version: string;
  description: string;
};

type OpenAIPluginAdvanced = {
  name: string;
  version: string;
  description: string;
  config: OpenAIConfig;
};

type OpenAIConfig = {
  advanced: string;
};

class OpenAIPlugin extends GentracePlugin<
  OpenAIPluginSimple,
  OpenAIPluginAdvanced
> {
  constructor(private config: OpenAIConfig) {
    super();
  }

  async simple(): Promise<OpenAIPluginSimple> {
    return {
      name: "OpenAIPlugin",
      version: "0.0.1",
      description: "OpenAIPlugin",
    };
  }

  async advanced(): Promise<OpenAIPluginAdvanced> {
    return {
      name: "OpenAIPlugin",
      version: "0.0.1",
      description: "OpenAIPlugin",
      config: this.config,
    };
  }
}

function runner<S, A>(plugin: GentracePlugin<S, A>) {
  return plugin.advanced();
}

async function testing() {
  const value = await runner(new OpenAIPlugin({ advanced: "advanced" }));
}

testing();
