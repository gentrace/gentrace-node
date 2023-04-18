import { PineconeClient } from "@pinecone-database/pinecone";
import {
  Delete1Request,
  FetchRequest,
  FetchResponse,
  InitOverrideFunction,
  QueryOperationRequest,
  QueryRequest,
  QueryResponse,
  UpdateOperationRequest,
  UpdateRequest,
  UpsertOperationRequest,
  UpsertRequest,
  UpsertResponse,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { PineconeConfiguration, Pipeline } from "../pipeline";
import { PipelineRun } from "../pipeline-run";
import { StepRun } from "../step-run";
import { Configuration as GentraceConfiguration } from "../../configuration";
import { OptionalPipelineId } from "../utils";

type PineconePipelineHandlerOptions = {
  pipelineRun?: PipelineRun;
  pipeline?: Pipeline;
  config: PineconeConfiguration;
  gentraceConfig: GentraceConfiguration;
};

type ModifyFirstParam<T, U> = T extends (
  param1: infer P,
  ...args: infer A
) => infer R
  ? (param1: U, ...args: A) => R
  : never;

export class PineconePipelineHandler extends PineconeClient {
  private pipeline: Pipeline;
  private pipelineRun?: PipelineRun;
  private gentraceConfig: GentraceConfiguration;
  private config: PineconeConfiguration;

  constructor({
    pipeline,
    pipelineRun,
    config,
    gentraceConfig,
  }: PineconePipelineHandlerOptions) {
    super();
    this.config = config;

    this.pipeline = pipeline;
    this.pipelineRun = pipelineRun;
    this.gentraceConfig = gentraceConfig;
  }

  public setPipelineRun(pipelineRun: PipelineRun) {
    this.pipelineRun = pipelineRun;
  }

  private async setupSelfContainedPipelineRun<T>(
    pipelineId: string | undefined,
    coreLogic: () => Promise<T>
  ): Promise<T & { pipelineRunId: string }> {
    if (!this.pipelineRun) {
      if (!pipelineId) {
        throw new Error(
          "The pipelineId attribute must be provided if you are not defining a self-contained PipelineRun."
        );
      }

      this.pipeline = new Pipeline({
        id: pipelineId,
        apiKey: this.gentraceConfig.apiKey,
        basePath: this.gentraceConfig.basePath,
      });

      this.pipelineRun = new PipelineRun({
        pipeline: this.pipeline,
      });
    }

    const returnValue = await coreLogic();

    const { pipelineRunId } = await this.pipelineRun.submit();

    (returnValue as unknown as { pipelineRunId: string }).pipelineRunId =
      pipelineRunId;

    return returnValue as T & { pipelineRunId: string };
  }

  /*
   * Pinecone-specific function overrides listed below
   */
  public async init() {
    await super.init({
      apiKey: this.config.apiKey,
      environment: this.config.environment,
    });
  }

  public Index(index: string) {
    const apiHandler = super.Index(index);

    type ModifiedFetchFunction = ModifyFirstParam<
      typeof apiHandler.fetch,
      FetchRequest & OptionalPipelineId
    >;

    const boundFetch = apiHandler.fetch.bind(apiHandler);
    const fetch: ModifiedFetchFunction = async (
      requestParameters: FetchRequest & OptionalPipelineId,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<FetchResponse> => {
      return this.setupSelfContainedPipelineRun(
        requestParameters.pipelineId,
        async () => {
          const startTime = performance.timeOrigin + performance.now();
          const response = await boundFetch(requestParameters, initOverrides);
          const endTime = performance.timeOrigin + performance.now();
          const elapsedTime = Math.floor(endTime - startTime);

          this.pipelineRun.addStepRun(
            new PineconeFetchStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ...requestParameters },
              response
            )
          );

          return response;
        }
      );
    };

    apiHandler.fetch = fetch;

    type ModifiedUpdateFunction = ModifyFirstParam<
      typeof apiHandler.update,
      UpdateOperationRequest & OptionalPipelineId
    >;

    const boundUpdate = apiHandler.update.bind(apiHandler);
    const update: ModifiedUpdateFunction = async (
      requestParameters: UpdateOperationRequest & OptionalPipelineId,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<FetchResponse> => {
      return this.setupSelfContainedPipelineRun(
        requestParameters.pipelineId,
        async () => {
          const { updateRequest } = requestParameters;
          const startTime = performance.timeOrigin + performance.now();
          const response = await boundUpdate(requestParameters, initOverrides);
          const endTime = performance.timeOrigin + performance.now();
          const elapsedTime = Math.floor(endTime - startTime);

          this.pipelineRun.addStepRun(
            new PineconeUpdateStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),

              { ...updateRequest },
              response
            )
          );

          return response;
        }
      );
    };

    apiHandler.update = update;

    type ModifiedQueryFunction = ModifyFirstParam<
      typeof apiHandler.query,
      QueryOperationRequest & OptionalPipelineId
    >;

    const boundQuery = apiHandler.query.bind(apiHandler);

    const query: ModifiedQueryFunction = async (
      requestParameters: QueryOperationRequest & OptionalPipelineId,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<QueryResponse> => {
      return this.setupSelfContainedPipelineRun(
        requestParameters.pipelineId,
        async () => {
          const { queryRequest } = requestParameters;

          const startTime = performance.timeOrigin + performance.now();
          const response = await boundQuery(requestParameters, initOverrides);
          const endTime = performance.timeOrigin + performance.now();
          const elapsedTime = Math.floor(endTime - startTime);

          const { topK, filter, ...inputs } = queryRequest;
          const modelParams = { topK, filter };

          this.pipelineRun.addStepRun(
            new PineconeQueryStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ...inputs },
              { ...modelParams },
              response
            )
          );

          return response;
        }
      );
    };

    apiHandler.query = query;

    type ModifiedUpsertFunction = ModifyFirstParam<
      typeof apiHandler.upsert,
      UpsertOperationRequest & OptionalPipelineId
    >;

    const boundUpsert = apiHandler.upsert.bind(apiHandler);
    const upsert: ModifiedUpsertFunction = async (
      requestParameters: UpsertOperationRequest & OptionalPipelineId,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<UpsertResponse> => {
      return this.setupSelfContainedPipelineRun(
        requestParameters.pipelineId,
        async () => {
          const { upsertRequest } = requestParameters;
          const startTime = performance.timeOrigin + performance.now();
          const response = await boundUpsert(requestParameters, initOverrides);
          const endTime = performance.timeOrigin + performance.now();
          const elapsedTime = Math.floor(endTime - startTime);

          this.pipelineRun.addStepRun(
            new PineconeUpsertStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ...upsertRequest },
              response
            )
          );

          return response;
        }
      );
    };

    apiHandler.upsert = upsert;

    type ModifiedDeleteFunction = ModifyFirstParam<
      typeof apiHandler.delete1,
      Delete1Request & OptionalPipelineId
    >;

    const boundDelete = apiHandler.delete1.bind(apiHandler);
    const delete1: ModifiedDeleteFunction = async (
      deleteRequest: Delete1Request & OptionalPipelineId,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<UpsertResponse> => {
      return this.setupSelfContainedPipelineRun(
        deleteRequest.pipelineId,
        async () => {
          const startTime = performance.timeOrigin + performance.now();
          const response = await boundDelete(deleteRequest, initOverrides);
          const endTime = performance.timeOrigin + performance.now();
          const elapsedTime = Math.floor(endTime - startTime);

          this.pipelineRun.addStepRun(
            new PineconeDeleteStepRun(
              elapsedTime,
              new Date(startTime).toISOString(),
              new Date(endTime).toISOString(),
              { ...deleteRequest },
              response
            )
          );

          return response;
        }
      );
    };

    apiHandler.delete1 = delete1;

    type ModifiedVectorOperationsApi = VectorOperationsApi & {
      fetch: ModifiedFetchFunction;
      update: ModifiedUpdateFunction;
      query: ModifiedQueryFunction;
      upsert: ModifiedUpsertFunction;
      delete1: ModifiedDeleteFunction;
    };

    return apiHandler as ModifiedVectorOperationsApi;
  }
}

class PineconeFetchStepRun extends StepRun {
  public inputs: FetchRequest;
  public response: FetchResponse;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: FetchRequest,
    response: FetchResponse
  ) {
    super(
      "pinecone",
      "pinecone_indexFetch",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response
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
    response: QueryResponse
  ) {
    super(
      "pinecone",
      "pinecone_indexQuery",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      modelParams,
      response
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
    response: object
  ) {
    super(
      "pinecone",
      "pinecone_indexUpdate",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response
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
    inputs: UpsertRequest,
    response: object
  ) {
    super(
      "pinecone",
      "pinecone_indexUpsert",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response
    );
  }
}

class PineconeDeleteStepRun extends StepRun {
  public inputs: Delete1Request;
  public response: object;

  constructor(
    elapsedTime: number,
    startTime: string,
    endTime: string,
    inputs: Delete1Request,
    response: object
  ) {
    super(
      "pinecone",
      "pinecone_indexDelete1",
      elapsedTime,
      startTime,
      endTime,
      inputs,
      {},
      response
    );
  }
}
