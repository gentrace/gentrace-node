export { init, type InitOptions } from './init';
export { setup } from './otel/setup'; // Still exported for advanced use cases
export { experiment } from './experiment';
export {
  startExperiment,
  finishExperiment,
  StartExperimentParams,
  FinishExperimentParams,
} from './experiment-control';
export { interaction, InteractionOptions } from './interaction';
export { evalDataset as evalDataset } from './eval-dataset';
export { traced, TracedConfig } from './traced';
export { evalOnce } from './eval-once';
export * from './otel';
