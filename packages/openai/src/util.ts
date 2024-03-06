export const isDefined = <T>(x: T | undefined | null): x is T => {
  return x !== undefined && x !== null;
};
