import {
  globalGentraceConfig,
  SimpleContext,
  SimpleHandler,
} from "@gentrace/core";
import {
  Index,
  PineconeConfiguration,
  QueryOptions,
  RecordMetadata,
  UpdateOptions,
} from "@pinecone-database/pinecone";
import {
  FunctionWithPipelineRunId,
  GentraceParams,
  ModifiedNamespaceFunction,
  ModifyFirstParam,
  ModifySecondParam,
  PineconePipelineHandler,
} from "../pinecone";

class SimplePinecone
  extends PineconePipelineHandler
  implements SimpleHandler<PineconeConfiguration>
{
  constructor(config: PineconeConfiguration) {
    if (!config) {
      throw new Error(
        "Pinecone configuration with API key and environment is required",
      );
    }

    super({
      gentraceConfig: globalGentraceConfig,
      config,
    });

    this.configProtected = config;
  }

  getConfig(): PineconeConfiguration {
    return this.configProtected;
  }

  // @ts-ignore
  public Index<T extends RecordMetadata = RecordMetadata>(index: string) {
    return this.index<T>(index);
  }

  // @ts-ignore: hack to avoid base class inheritance issues
  public index<T extends RecordMetadata = RecordMetadata>(index: string) {
    const apiHandler = super.indexInner<T>(index);

    type FetchFunctionType = typeof apiHandler.fetch;

    type ModifiedFetchFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        FetchFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: SimpleContext;
        }
      >
    >;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpdateFunctionType,
        UpdateOptions &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: SimpleContext;
          }
      >
    >;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        QueryFunctionType,
        QueryOptions &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: SimpleContext;
          }
      >
    >;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        UpsertFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: SimpleContext;
        }
      >
    >;

    type DeleteOneFunctionType = typeof apiHandler.deleteOne;

    type ModifiedDeleteOneFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        DeleteOneFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: SimpleContext;
        }
      >
    >;

    type DeleteManyFunctionType = typeof apiHandler.deleteMany;

    type ModifiedDeleteManyFunction = FunctionWithPipelineRunId<
      ModifySecondParam<
        DeleteManyFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: SimpleContext;
        }
      >
    >;

    type DeleteAllFunctionType = typeof apiHandler.deleteAll;

    type ModifiedDeleteAllFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        DeleteAllFunctionType,
        Omit<GentraceParams, "gentrace"> & {
          gentrace?: SimpleContext;
        }
      >
    >;

    type ModifiedSimpleIndex = Omit<
      Index,
      | "fetch"
      | "update"
      | "query"
      | "upsert"
      | "deleteOne"
      | "deleteMany"
      | "deleteAll"
      | "namespace"
    > & {
      fetch: ModifiedFetchFunction;
      update: ModifiedUpdateFunction;
      query: ModifiedQueryFunction;
      upsert: ModifiedUpsertFunction;
      deleteOne: ModifiedDeleteOneFunction;
      deleteMany: ModifiedDeleteManyFunction;
      deleteAll: ModifiedDeleteAllFunction;
      namespace: ModifiedNamespaceFunction;
    };

    return apiHandler as ModifiedSimpleIndex;
  }
}

export { SimplePinecone };
