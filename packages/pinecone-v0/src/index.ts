import { SimplePineconeClient } from "./handlers/simple";
import { initPlugin, PineconePlugin } from "./plugin";

import {
  PineconeDeleteStepRun,
  PineconeFetchStepRun,
  PineconeQueryStepRun,
  PineconeUpdateStepRun,
  PineconeUpsertStepRun,
} from "./pinecone";

export {
  initPlugin,
  PineconePlugin,
  SimplePineconeClient as PineconeClient,
  PineconeDeleteStepRun,
  PineconeFetchStepRun,
  PineconeQueryStepRun,
  PineconeUpdateStepRun,
  PineconeUpsertStepRun,
};
