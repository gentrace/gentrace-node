import { Configuration } from "../configuration";
import { Pipeline } from "./pipeline";
import { PipelineRun } from "./pipeline-run";

export abstract class GentracePlugin<C, A> {
  abstract config: C;

  abstract getConfig(): C;

  abstract auth<T>(): Promise<T>;

  abstract advanced<
    T extends { [key: string]: GentracePlugin<any, any> },
  >(params: {
    pipeline: Pipeline<T>;
    pipelineRun: PipelineRun;
    gentraceConfig: Configuration;
  }): A;
}

export type InitPluginFunction<C extends object, A> = (
  config: C,
) => GentracePlugin<C, A>;
