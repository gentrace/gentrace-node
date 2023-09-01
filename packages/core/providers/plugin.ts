import { Configuration } from "../configuration";
import { Pipeline } from "./pipeline";
import { PipelineRun } from "./pipeline-run";

export interface IGentracePlugin<C, S, A> {
  config: C;

  getConfig(): C;

  auth<T>(): Promise<T>;

  advanced(params: {
    pipeline: Pipeline;
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): A;
}

export abstract class GentracePlugin<C, S, A>
  implements IGentracePlugin<C, S, A>
{
  abstract config: C;

  abstract getConfig(): C;

  abstract auth<T>(): Promise<T>;

  abstract advanced(params: {
    pipeline: Pipeline;
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): A;
}

export type InitPluginFunction<C extends object, S, A> = (
  config: C,
) => GentracePlugin<C, S, A>;
