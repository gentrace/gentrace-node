export interface IGentracePlugin<C, S, A> {
  config: C;

  getConfig(): C;

  auth<T>(): Promise<T>;

  simple(): S;

  advanced(): A;
}

export abstract class GentracePlugin<C, S, A>
  implements IGentracePlugin<C, S, A>
{
  abstract config: C;

  abstract getConfig(): C;

  abstract auth<T>(): Promise<T>;

  abstract simple(): S;

  abstract advanced(): A;
}

export type InitPluginFunction<C extends object, S, A> = (
  config: C,
) => GentracePlugin<C, S, A>;
