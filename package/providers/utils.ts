export type OptionalPipelineId = {
  pipelineId?: string;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

const ARGUMENT_NAMES = /([^\s,]+)/g;

// Source: https://stackoverflow.com/a/9924463/1057411
export function getParamNames<F extends (...args: any[]) => any>(func: F) {
  let fnStr = func.toString().replace(STRIP_COMMENTS, "");
  let result = Array.from(
    fnStr
      .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
      .match(ARGUMENT_NAMES)
  );

  if (!result) {
    result = [];
  }

  return result;
}

export function zip<S1, S2>(
  firstCollection: Array<S1>,
  lastCollection: Array<S2>
): Array<[S1, S2]> {
  const length = Math.min(firstCollection.length, lastCollection.length);
  const zipped: Array<[S1, S2]> = [];

  for (let index = 0; index < length; index++) {
    zipped.push([firstCollection[index], lastCollection[index]]);
  }

  return zipped;
}
