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
  }
}

export type StepRunType = typeof StepRun;
export type PartialStepRunType = Partial<StepRun>;
