import {
  Context,
  Configuration as GentraceConfiguration,
  Pipeline,
  PipelineRun,
  StepRun,
} from "@gentrace/core";
import {
  DeleteManyOptions,
  DeleteOneOptions,
  FetchOptions,
  FetchResponse,
  Index,
  Pinecone,
  PineconeConfiguration,
  PineconeRecord,
  QueryOptions,
  QueryResponse,
  RecordMetadata,
  UpdateOptions,
} from "@pinecone-database/pinecone";

export type GentraceParams = {
  pipelineSlug?: string;
  gentrace?: Context;
};

type PineconePipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  config?: PineconeConfiguration;
  gentraceConfig: GentraceConfiguration;
};

export type ModifyFirstParam<T, U> = T extends (
  param1: infer P,
  ...args: infer A
) => infer R
  ? (param1: U, ...args: A) => R
  : never;

export type ModifySecondParam<T, U> = T extends (
  param1: infer P1,
  param2: infer P2,
  ...args: infer A
) => infer R
  ? (param1: P1, param2?: U, ...args: A) => R
  : never;

export type ModifyReturnType<T, NewReturn> = T extends (
  ...args: infer A
) => infer R
  ? (...args: A) => NewReturn
  : never;

type AppendGentraceParams<F extends (...args: any[]) => any> = (
  ...args: [...Parameters<F>, GentraceParams?]
) => ReturnType<F>;

type FetchFunctionType = typeof Index.prototype.fetch;

type ModifiedFetchFunction = FunctionWithPipelineRunId<
  AppendGentraceParams<FetchFunctionType>
>;

type UpdateFunctionType = typeof Index.prototype.update;

type ModifiedUpdateFunction = FunctionWithPipelineRunId<
  ModifyFirstParam<UpdateFunctionType, UpdateOptions & GentraceParams>
>;

type QueryFunctionType = typeof Index.prototype.query;

type ModifiedQueryFunction = FunctionWithPipelineRunId<
  ModifyFirstParam<QueryFunctionType, QueryOptions & GentraceParams>
>;

type UpsertFunctionType = typeof Index.prototype.upsert;

type ModifiedUpsertFunction = FunctionWithPipelineRunId<
  AppendGentraceParams<UpsertFunctionType>
>;

type DeleteOneFunctionType = typeof Index.prototype.deleteOne;

type ModifiedDeleteOneFunction = FunctionWithPipelineRunId<
  AppendGentraceParams<DeleteOneFunctionType>
>;

type DeleteManyFunctionType = typeof Index.prototype.deleteMany;

type ModifiedDeleteManyFunction = FunctionWithPipelineRunId<
  AppendGentraceParams<DeleteManyFunctionType>
>;

type DeleteAllFunctionType = typeof Index.prototype.deleteAll;

type ModifiedDeleteAllFunction = FunctionWithPipelineRunId<
  AppendGentraceParams<DeleteAllFunctionType>
>;

export type ModifiedNamespaceFunction = (namespace: string) => ModifiedIndex;

export type ModifiedIndex = Omit<
  Index,
  "fetch" | "update" | "query" | "upsert" | "deleteOne"
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

export type FunctionWithPipelineRunId<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>> & { pipelineRunId: string }>;

export class PineconePipelineHandler extends Pinecone {
  protected pipelineRun?: PipelineRun;
  protected gentraceConfig: GentraceConfiguration;
  protected configProtected?: PineconeConfiguration;

  constructor({
    pipelineRun,
    config,
    gentraceConfig,
  }: PineconePipelineHandlerOptions) {
    super(config);
    this.configProtected = config;

    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  public setPipelineRun(pipelineRun: PipelineRun) {
    this.pipelineRun = pipelineRun;
  }

  private async setupSelfContainedPipelineRun<T>(
    pipelineId: string | undefined,
    coreLogic: (pipelineRun: PipelineRun) => Promise<T>,
  ): Promise<T & { pipelineRunId?: string }> {
    let isSelfContainedPipelineRun = !this.pipelineRun && pipelineId;

    let pipelineRun = this.pipelineRun;

    if (isSelfContainedPipelineRun) {
      const pipeline = new Pipeline({
        slug: pipelineId,
        apiKey: this.gentraceConfig.apiKey,
        basePath: this.gentraceConfig.basePath,
        logger: this.gentraceConfig.logger,
      });

      pipelineRun = new PipelineRun({
        pipeline,
      });
    }

    let returnValue = await coreLogic(pipelineRun);

    if (isSelfContainedPipelineRun) {
      const { pipelineRunId } = await pipelineRun.submit();

      // Return value could be void (e.g. in upsert)
      if (!returnValue) {
        // @ts-ignore
        returnValue = {} as T;
      }

      (returnValue as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return returnValue as T & { pipelineRunId: string };
    }

    return returnValue;
  }

  // @ts-ignore: hack to avoid base class inheritance issues
  public indexInner<T extends RecordMetadata = RecordMetadata>(
    index: string,
    namespace: string = "",
  ) {
    const apiHandler = new Index<T>(index, this.configProtected, namespace);

    type FetchFunctionType = typeof apiHandler.fetch;

    type ModifiedFetchFunction = FunctionWithPipelineRunId<
      AppendGentraceParams<FetchFunctionType>
    >;

    const boundFetch = apiHandler.fetch.bind(apiHandler);
    const fetch: ModifiedFetchFunction = async (
      options: FetchOptions,
      gentraceParams?: GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        gentraceParams?.pipelineSlug,
        async (pipelineRun) => {
          const startTime = Date.now();
          const response = await boundFetch(options);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeFetchStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ids: options },
              response,
              gentraceParams?.gentrace ?? {},
            ),
          );

          return response;
        },
      );
    };

    // @ts-ignore
    apiHandler.fetch = fetch;

    type UpdateFunctionType = typeof apiHandler.update;

    type ModifiedUpdateFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<UpdateFunctionType, UpdateOptions & GentraceParams>
    >;

    const boundUpdate = apiHandler.update.bind(apiHandler);
    const update: ModifiedUpdateFunction = async (
      options: UpdateOptions & GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        options.pipelineSlug,
        async (pipelineRun) => {
          const { gentrace, pipelineSlug, ...originalOptions } = options;

          const startTime = Date.now();
          const response = await boundUpdate(options);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeUpdateStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),

              { ...originalOptions },
              response,
              options.gentrace ?? {},
            ),
          );

          return response;
        },
      );
    };

    apiHandler.update = update;

    type QueryFunctionType = typeof apiHandler.query;

    type ModifiedQueryFunction = FunctionWithPipelineRunId<
      ModifyFirstParam<QueryFunctionType, QueryOptions & GentraceParams>
    >;

    const boundQuery = apiHandler.query.bind(apiHandler);

    const query: ModifiedQueryFunction = async (
      options: QueryOptions & GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        options.pipelineSlug,
        async (pipelineRun) => {
          const { gentrace, pipelineSlug, ...originalOptions } = options;

          const startTime = Date.now();
          const response = await boundQuery(originalOptions);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          const { topK, filter, ...inputs } = originalOptions;
          const modelParams = { topK, filter };

          pipelineRun?.addStepRunNode(
            new PineconeQueryStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ...inputs },
              { ...modelParams },
              response,
              options.gentrace ?? {},
            ),
          );

          return response;
        },
      );
    };

    apiHandler.query = query;

    type UpsertFunctionType = typeof apiHandler.upsert;

    type ModifiedUpsertFunction = FunctionWithPipelineRunId<
      AppendGentraceParams<UpsertFunctionType>
    >;

    const boundUpsert = apiHandler.upsert.bind(apiHandler);
    const upsert: ModifiedUpsertFunction = async (records, gentraceParams) => {
      return this.setupSelfContainedPipelineRun(
        gentraceParams?.pipelineSlug,
        async (pipelineRun) => {
          const startTime = Date.now();
          const returnValue = await boundUpsert(records);

          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeUpsertStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { records },
              gentraceParams?.gentrace ?? {},
            ),
          );

          return returnValue;
        },
      );
    };

    // @ts-ignore
    apiHandler.upsert = upsert;

    type DeleteOneFunctionType = typeof apiHandler.deleteOne;

    type ModifiedDeleteOneFunction = FunctionWithPipelineRunId<
      AppendGentraceParams<DeleteOneFunctionType>
    >;

    const boundOneDelete = apiHandler.deleteOne.bind(apiHandler);
    const deleteOne: ModifiedDeleteOneFunction = async (
      recordId: DeleteOneOptions,
      gentraceParams?: GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        gentraceParams?.pipelineSlug,
        async (pipelineRun) => {
          const startTime = Date.now();
          const returnValue = await boundOneDelete(recordId);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteOneStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { recordId },
              gentraceParams?.gentrace ?? {},
            ),
          );

          return returnValue;
        },
      );
    };

    // @ts-ignore
    apiHandler.deleteOne = deleteOne;

    type DeleteManyFunctionType = typeof apiHandler.deleteMany;

    type ModifiedDeleteManyFunction = FunctionWithPipelineRunId<
      AppendGentraceParams<DeleteManyFunctionType>
    >;

    const boundManyDelete = apiHandler.deleteMany.bind(apiHandler);
    const deleteMany: ModifiedDeleteManyFunction = async (
      options: DeleteManyOptions,
      gentraceParams?: GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        gentraceParams?.pipelineSlug,
        async (pipelineRun) => {
          const startTime = Date.now();
          const returnValue = await boundManyDelete(options);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteManyStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { options },
              gentraceParams?.gentrace ?? {},
            ),
          );

          return returnValue;
        },
      );
    };

    // @ts-ignore
    apiHandler.deleteMany = deleteMany;

    type DeleteAllFunctionType = typeof apiHandler.deleteAll;

    type ModifiedDeleteAllFunction = FunctionWithPipelineRunId<
      AppendGentraceParams<DeleteAllFunctionType>
    >;

    const boundAllDelete = apiHandler.deleteAll.bind(apiHandler);
    const deleteAll: ModifiedDeleteAllFunction = async (
      gentraceParams?: GentraceParams,
    ) => {
      return this.setupSelfContainedPipelineRun(
        gentraceParams?.pipelineSlug,
        async (pipelineRun) => {
          const startTime = Date.now();
          const returnValue = await boundAllDelete();
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteAllStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              gentraceParams?.gentrace ?? {},
            ),
          );

          return returnValue;
        },
      );
    };

    // @ts-ignore
    apiHandler.deleteAll = deleteAll;

    type ModifiedNamespaceFunction = (namespace: string) => ModifiedIndex;

    const namespaceFn: ModifiedNamespaceFunction = (namespace: string) => {
      return this.indexInner(index, namespace);
    };

    // @ts-ignore
    apiHandler.namespace = namespaceFn;

    // @ts-ignore
    return apiHandler as ModifiedIndex;
  }
}

export class PineconeFetchStepRun extends StepRun {
  public inputs: { ids: FetchOptions };
  public response: FetchResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { ids: FetchOptions },
    response: FetchResponse,
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexFetch",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response,
      context ?? {},
    );
  }
}

export class PineconeQueryStepRun extends StepRun {
  public inputs: QueryOptions;
  public response: QueryResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<QueryOptions, "topK" | "filter">,
    modelParams: Pick<QueryOptions, "topK" | "filter">,
    response: QueryResponse,
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexQuery",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response,
      context ?? {},
    );
  }
}

export class PineconeUpdateStepRun extends StepRun {
  public inputs: UpdateOptions;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: UpdateOptions,
    response: object,
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexUpdate",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response,
      context ?? {},
    );
  }
}

export class PineconeUpsertStepRun extends StepRun {
  public inputs: { records: PineconeRecord<RecordMetadata>[] };
  public response: any;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { records: PineconeRecord<RecordMetadata>[] },
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexUpsert",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      {},
      context ?? {},
    );
  }
}

export class PineconeDeleteOneStepRun extends StepRun {
  public inputs: DeleteOneOptions;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { recordId: DeleteOneOptions },
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexDelete1",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      {},
      context ?? {},
    );
  }
}

export class PineconeDeleteManyStepRun extends StepRun {
  public inputs: DeleteManyOptions;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { options: DeleteManyOptions },
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexDeleteMany",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      {},
      context ?? {},
    );
  }
}

export class PineconeDeleteAllStepRun extends StepRun {
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    context: Context,
  ) {
    super(
      "pinecone",
      "pinecone_indexDeleteAll",
      elapsedTime,
      startTime,
      endTime,
      {},
      {},
      {},
      context ?? {},
    );
  }
}
