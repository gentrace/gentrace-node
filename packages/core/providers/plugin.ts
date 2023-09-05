import { Configuration } from "../configuration";
import { SimpleHandler } from "./handler";
import { Pipeline } from "./pipeline";
import { PipelineRun } from "./pipeline-run";

export abstract class GentracePlugin<C, A> {
  abstract config: C;

  abstract getConfig(): C;

  abstract advanced<
    T extends { [key: string]: GentracePlugin<any, any> },
  >(params: {
    pipeline: Pipeline<T>;
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): A;
}

export type InitPluginFunction<C extends object, A> = (
  config: C | SimpleHandler<C>,
) => Promise<GentracePlugin<C, A>>;
