// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

export { Gentrace as default } from './client';

export { type Uploadable, toFile } from './core/uploads';
export { APIPromise } from './core/api-promise';
export { Gentrace, type ClientOptions } from './client';

// Custom exports
export { init } from './lib/init';
export { experiment } from './lib/experiment';
export {
  startExperiment,
  finishExperiment,
  StartExperimentParams,
  FinishExperimentParams,
} from './lib/experiment-control';
export { interaction } from './lib/interaction';
export { testDataset } from './lib/test-dataset';
export { test } from './lib/test-single';

export {
  GentraceError,
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BadRequestError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  UnprocessableEntityError,
} from './core/error';
