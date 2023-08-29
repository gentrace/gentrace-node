import { Configuration as GentraceConfiguration } from "../../configuration";
import { globalGentraceConfig } from "../../providers/init";
import {
  FunctionWithPipelineRunId,
  ModifyFirstParam,
  PineconePipelineHandler,
} from "../../handlers/vectorstores/pinecone";
import {
  Delete1Request,
  FetchRequest,
  QueryOperationRequest,
  UpdateOperationRequest,
  UpsertOperationRequest,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { GentraceParams } from "../utils";

class AdvancedPineconeClient extends PineconePipelineHandler {
  // @ts-ignore: hack to avoid base class inheritance issues
  public Index(index: string) {
    const apiHandler = super.IndexInner(index);

    type FetchFunctionType = typeof apiHandler.fetch;

    type ModifiedFetchFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        FetchFunctionType,
        FetchRequest &
          Omit<GentraceParams, "gentrace"> & {
            // TODO: Add future required params here
            gentrace: {};
          }
      >
    >;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpdateFunctionType,
        UpdateOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            // TODO: Add future required params here
            gentrace: {};
          }
      >
    >;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        QueryFunctionType,
        QueryOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            // TODO: Add future required params here
            gentrace: {};
          }
      >
    >;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpsertFunctionType,
        UpsertOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            // TODO: Add future required params here
            gentrace: {};
          }
      >
    >;

    type DeleteFunctionType = typeof apiHandler.delete1;

    type ModifiedDeleteFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        DeleteFunctionType,
        Delete1Request &
          Omit<GentraceParams, "gentrace"> & {
            // TODO: Add future required params here
            gentrace: {};
          }
      >
    >;

    type ModifiedVectorOperationsApi = Omit<
      VectorOperationsApi,
      "fetch" | "update" | "query" | "upsert" | "delete1"
    > & {
      fetch: ModifiedFetchFunction;
      update: ModifiedUpdateFunction;
      query: ModifiedQueryFunction;
      upsert: ModifiedUpsertFunction;
      delete1: ModifiedDeleteFunction;
    };

    return apiHandler as ModifiedVectorOperationsApi;
  }
}

export { AdvancedPineconeClient as PineconeClient };
