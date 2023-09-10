import { AdvancedContext } from "@gentrace/core";
import {
  Delete1Request,
  FetchRequest,
  QueryOperationRequest,
  UpdateOperationRequest,
  UpsertOperationRequest,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import {
  FunctionWithPipelineRunId,
  ModifyFirstParam,
  PineconePipelineHandler,
  GentraceParams,
} from "../pinecone";

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
            gentrace?: AdvancedContext;
          }
      >
    >;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpdateFunctionType,
        UpdateOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
          }
      >
    >;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        QueryFunctionType,
        QueryOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
          }
      >
    >;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpsertFunctionType,
        UpsertOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
          }
      >
    >;

    type DeleteFunctionType = typeof apiHandler.delete1;

    type ModifiedDeleteFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        DeleteFunctionType,
        Delete1Request &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
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

export { AdvancedPineconeClient };
