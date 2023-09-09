import { AdvancedContext } from "@gentrace/core";
import {
  Index,
  QueryOptions,
  UpdateOptions,
} from "@pinecone-database/pinecone";
import {
  FunctionWithPipelineRunId,
  GentraceParams,
  ModifyFirstParam,
  ModifySecondParam,
  PineconePipelineHandler,
} from "../pinecone";

class AdvancedPinecone extends PineconePipelineHandler {
  // @ts-ignore
  public Index(index: string) {
    return this.index(index);
  }

  // @ts-ignore: hack to avoid base class inheritance issues
  public index(index: string) {
    const apiHandler = super.indexInner(index);

    type FetchFunctionType = typeof apiHandler.fetch;

    type ModifiedFetchFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        FetchFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: AdvancedContext;
        }
      >
    >;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpdateFunctionType,
        UpdateOptions &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
          }
      >
    >;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        QueryFunctionType,
        QueryOptions &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: AdvancedContext;
          }
      >
    >;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        UpsertFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: AdvancedContext;
        }
      >
    >;

    type DeleteOneFunctionType = typeof apiHandler.deleteOne;

    type ModifiedDeleteOneFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        DeleteOneFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: AdvancedContext;
        }
      >
    >;

    type DeleteManyFunctionType = typeof apiHandler.deleteMany;

    type ModifiedDeleteManyFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        DeleteManyFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: AdvancedContext;
        }
      >
    >;

    type DeleteAllFunctionType = typeof apiHandler.deleteAll;

    type ModifiedDeleteAllFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        DeleteAllFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: AdvancedContext;
        }
      >
    >;

    type ModifiedAdvancedIndex = Omit<
      Index,
      | "fetch"
      | "update"
      | "query"
      | "upsert"
      | "deleteOne"
      | "deleteMany"
      | "deleteAll"
    > & {
      fetch: ModifiedFetchFunction;
      update: ModifiedUpdateFunction;
      query: ModifiedQueryFunction;
      upsert: ModifiedUpsertFunction;
      deleteOne: ModifiedDeleteOneFunction;
      deleteMany: ModifiedDeleteManyFunction;
      deleteAll: ModifiedDeleteAllFunction;
    };

    return apiHandler as ModifiedAdvancedIndex;
  }
}

export { AdvancedPinecone };
