import {
  Configuration as GentraceConfiguration,
  Context,
  Pipeline,
  PipelineRun,
  StepRun,
} from "@gentrace/core";
import {
  DeleteManyOptions,
  DeleteOneOptions,
  FetchOptions,
  Index,
  Pinecone,
  PineconeRecord,
  QueryOptions,
  RecordMetadata,
  UpdateOptions,
  FetchResponse,
  QueryRequest,
  QueryResponse,
  UpdateRequest,
  UpsertRequest,
  PineconeConfiguration,
} from "@pinecone-database/pinecone";
import {
  FetchRequest,
  UpsertResponse,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";

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

type AppendGentraceParams<F extends (...args: any[]) => any> = (
  ...args: [...Parameters<F>, GentraceParams]
) => ReturnType<F>;

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

    const returnValue = await coreLogic(pipelineRun);

    if (isSelfContainedPipelineRun) {
      const { pipelineRunId } = await pipelineRun.submit();
      (returnValue as unknown as { pipelineRunId: string }).pipelineRunId =
        pipelineRunId;

      return returnValue as T & { pipelineRunId: string };
    }

    return returnValue;
  }

  // @ts-ignore: hack to avoid base class inheritance issues
  public indexInner(index: string) {
    const apiHandler = super.index(index);

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
          const response = await boundUpsert(records);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeUpsertStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { records },
              response,
              gentraceParams.gentrace ?? {},
            ),
          );

          return response;
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
          const response = await boundOneDelete(recordId);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteOneStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { recordId },
              response,
              gentraceParams.gentrace ?? {},
            ),
          );

          return response;
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
          const response = await boundManyDelete(options);
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteManyStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { options },
              response,
              gentraceParams.gentrace ?? {},
            ),
          );

          return response;
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
          const response = await boundAllDelete();
          const endTime = Date.now();
          const elapsedTime = Math.floor(endTime - startTime);

          pipelineRun?.addStepRunNode(
            new PineconeDeleteAllStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              response,
              gentraceParams.gentrace ?? {},
            ),
          );

          return response;
        },
      );
    };

    // @ts-ignore
    apiHandler.deleteAll = deleteAll;

    type ModifiedIndex = Omit<
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
    };

    // @ts-ignore
    return apiHandler as ModifiedIndex;
  }
}

class PineconeFetchStepRun extends StepRun {
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

class PineconeQueryStepRun extends StepRun {
  public inputs: FetchRequest;
  public response: FetchResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Omit<QueryRequest, "topK" | "filter">,
    modelParams: Pick<QueryRequest, "topK" | "filter">,
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

class PineconeUpdateStepRun extends StepRun {
  public inputs: FetchRequest;
  public response: FetchResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: UpdateRequest,
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

class PineconeUpsertStepRun extends StepRun {
  public inputs: UpsertRequest;
  public response: UpsertResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { records: PineconeRecord<RecordMetadata>[] },
    response: object,
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
      response,
      context ?? {},
    );
  }
}

class PineconeDeleteOneStepRun extends StepRun {
  public inputs: DeleteOneOptions;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { recordId: DeleteOneOptions },
    response: object,
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
      response,
      context ?? {},
    );
  }
}

class PineconeDeleteManyStepRun extends StepRun {
  public inputs: DeleteManyOptions;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: { options: DeleteManyOptions },
    response: object,
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
      response,
      context ?? {},
    );
  }
}

class PineconeDeleteAllStepRun extends StepRun {
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    response: object,
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
      response,
      context ?? {},
    );
  }
}
