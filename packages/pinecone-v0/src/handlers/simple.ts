import {
  globalGentraceConfig,
  Configuration as GentraceConfiguration,
  PluginContext,
  SimpleHandler,
} from "@gentrace/core";
import {
  FunctionWithPipelineRunId,
  ModifyFirstParam,
  PineconePipelineHandler,
  GentraceParams,
  PineconeConfiguration,
} from "../pinecone";
import {
  Delete1Request,
  FetchRequest,
  QueryOperationRequest,
  UpdateOperationRequest,
  UpsertOperationRequest,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";

class SimplePineconeClient
  extends PineconePipelineHandler
  implements SimpleHandler<PineconeConfiguration>
{
  constructor(params?: {
    /**
     * @deprecated Declare the API key in the init() call instead.
     */
    gentraceApiKey?: string;
    /**
     * @deprecated Declare the base path in the init() call instead.
     */
    gentraceBasePath?: string;
  }) {
    const { gentraceApiKey, gentraceBasePath } = params ?? {};
    let gentraceConfig: GentraceConfiguration | null = null;

    if (gentraceApiKey) {
      gentraceConfig = new GentraceConfiguration({
        apiKey: gentraceApiKey,
        basePath: gentraceBasePath,
      });
    } else {
      gentraceConfig = globalGentraceConfig;
    }

    super({
      gentraceConfig,
    });
  }
  getConfig(): PineconeConfiguration {
    return this.config;
  }

  // @ts-ignore: hack to avoid base class inheritance issues
  public Index(index: string) {
    const apiHandler = super.IndexInner(index);

    type FetchFunctionType = typeof apiHandler.fetch;

    type ModifiedFetchFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        FetchFunctionType,
        FetchRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: PluginContext;
          }
      >
    >;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpdateFunctionType,
        UpdateOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: PluginContext;
          }
      >
    >;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        QueryFunctionType,
        QueryOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: PluginContext;
          }
      >
    >;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        UpsertFunctionType,
        UpsertOperationRequest &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: PluginContext;
          }
      >
    >;

    type DeleteFunctionType = typeof apiHandler.delete1;

    type ModifiedDeleteFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<
        DeleteFunctionType,
        Delete1Request &
          Omit<GentraceParams, "gentrace"> & {
            gentrace?: PluginContext;
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

export { SimplePineconeClient };
