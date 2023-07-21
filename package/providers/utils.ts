export type OptionalPipelineId = {
  pipelineId?: string;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
