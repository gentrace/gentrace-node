import { Context } from "./context";

export class StepRun {
  public providerName: string;
  public invocation: string;

  public elapsedTime: number;
  public startTime: string;
  public endTime: string;

  public inputs: any;
  public modelParams: any;
  public outputs: any;
  public context: Context;
  public error: string | undefined;

  constructor(
    providerName: string,
    invocation: string,
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: any,
    modelParams: any,
    outputs: any,
    context: Context,
    error: string | undefined,
  ) {
    this.providerName = providerName;
    this.invocation = invocation;
    this.elapsedTime = elapsedTime;
    this.startTime = startTime;
    this.endTime = endTime;

    this.inputs = inputs;
    this.modelParams = modelParams;
    this.outputs = outputs;
    this.context = context;
    this.error = error;
  }
}

export type StepRunType = typeof StepRun;
export type PartialStepRunType = Partial<StepRun>;
