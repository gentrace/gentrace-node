import { SimplePinecone } from "./handlers/simple";
import { initPlugin, PineconePlugin } from "./plugin";
import {
  PineconeDeleteAllStepRun,
  PineconeDeleteManyStepRun,
  PineconeDeleteOneStepRun,
  PineconeFetchStepRun,
  PineconeQueryStepRun,
  PineconeUpdateStepRun,
  PineconeUpsertStepRun,
} from "./pinecone";

export {
  initPlugin,
  PineconePlugin,
  SimplePinecone as Pinecone,
  PineconeDeleteAllStepRun,
  PineconeDeleteManyStepRun,
  PineconeDeleteOneStepRun,
  PineconeFetchStepRun,
  PineconeQueryStepRun,
  PineconeUpdateStepRun,
  PineconeUpsertStepRun,
};
