export class StepRun {
  public provider: string;
  public invocation: string;

  public elapsedTime: number;
  public startTime: string;
  public endTime: string;

  public inputs: any;
  public modelParams: any;
  public outputs: any;

  constructor(
    provider: string,
    invocation: string,
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: any,
    modelParams: any,
    outputs: any
  ) {
    this.provider = provider;
    this.invocation = invocation;
    this.elapsedTime = elapsedTime;
    this.startTime = startTime;
    this.endTime = endTime;

    this.inputs = inputs;
    this.modelParams = modelParams;
    this.outputs = outputs;
  }
}
