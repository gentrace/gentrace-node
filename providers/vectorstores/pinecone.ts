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
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { StepRun } from "../step-run";
import { Pipeline } from "../pipeline";
import { PipelineRun } from "../pipeline-run";

export class PineconeHandler extends PineconeClient {
  private pipelineRun: PipelineRun;
  private pipeline: Pipeline;

  constructor({
    pipeline,
    pipelineRun,
  }: {
    pipeline: Pipeline;
    pipelineRun: PipelineRun;
  }) {
    super();

    this.pipeline = pipeline;
    this.pipelineRun = pipelineRun;
  }

  public async init() {
    super.init({
      apiKey: this.pipeline.pineconeConfiguration.apiKey,
      environment: this.pipeline.pineconeConfiguration.environment,
    });
  }

  public Index(index: string) {
    const apiHandler = super.Index(index);

    const boundFetch = apiHandler.fetch.bind(apiHandler);
    apiHandler.fetch = async (
      requestParameters: FetchRequest,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<FetchResponse> => {
      const startTime = performance.timeOrigin + performance.now();
      const response = await boundFetch(requestParameters, initOverrides);
      const endTime = performance.timeOrigin + performance.now();
      const elapsedTime = endTime - startTime;

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
    };

    const boundUpdate = apiHandler.update.bind(apiHandler);
    apiHandler.update = async (
      requestParameters: UpdateOperationRequest,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<FetchResponse> => {
      const { updateRequest } = requestParameters;
      const startTime = performance.timeOrigin + performance.now();
      const response = await boundUpdate(requestParameters, initOverrides);
      const endTime = performance.timeOrigin + performance.now();
      const elapsedTime = endTime - startTime;

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
    };

    const boundQuery = apiHandler.query.bind(apiHandler);

    apiHandler.query = async (
      requestParameters: QueryOperationRequest,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<QueryResponse> => {
      const { queryRequest } = requestParameters;

      const startTime = performance.timeOrigin + performance.now();
      const response = await boundQuery(requestParameters, initOverrides);
      const endTime = performance.timeOrigin + performance.now();
      const elapsedTime = endTime - startTime;

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
    };

    const boundUpsert = apiHandler.upsert.bind(apiHandler);
    apiHandler.upsert = async (
      requestParameters: UpsertOperationRequest,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<UpsertResponse> => {
      const { upsertRequest } = requestParameters;
      const startTime = performance.timeOrigin + performance.now();
      const response = await boundUpsert(requestParameters, initOverrides);
      const endTime = performance.timeOrigin + performance.now();
      const elapsedTime = endTime - startTime;

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
    };

    const boundDelete = apiHandler.delete1.bind(apiHandler);
    apiHandler.delete1 = async (
      deleteRequest: Delete1Request,
      initOverrides?: RequestInit | InitOverrideFunction
    ): Promise<UpsertResponse> => {
      const startTime = performance.timeOrigin + performance.now();
      const response = await boundDelete(deleteRequest, initOverrides);
      const endTime = performance.timeOrigin + performance.now();
      const elapsedTime = endTime - startTime;

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
    };

    return apiHandler;
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
