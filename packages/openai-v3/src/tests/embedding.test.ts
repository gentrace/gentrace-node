import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { Configuration, OpenAIApi } from "../index";
import { config } from "dotenv";
import { init } from "@gentrace/core";
import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";

config();

describe("test_openai_embedding_pipeline", () => {
  const embeddingResponse = {
    data: [
      {
        embedding: "",
        index: 0,
        object: "embedding",
      },
    ],
    model: "text-similarity-davinci:001",
    object: "list",
    usage: { prompt_tokens: 2, total_tokens: 2 },
  };

  const gentracePipelineRunResponse = {
    pipelineRunId: "1f2e8493-5fd1-4359-8cd7-867175d6d9aa",
  };

  let server: SetupServer;
  let interceptor = new FetchInterceptor();

  beforeAll(() => {
    interceptor.apply();

    interceptor.on("request", (request) => {
      request.respondWith({
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gentracePipelineRunResponse),
      });
    });
    server = setupServer(
      rest.post("https://api.openai.com/v1/embeddings", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(embeddingResponse),
        );
      }),
      rest.post("https://gentrace.ai/api/v1/run", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(gentracePipelineRunResponse),
        );
      }),
    );
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  it("should return pipelineRunId when embedding is passed", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: "openai-api-key",
      }),
    );

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: "testing",
      pipelineId: "testing-pipeline-id",
    });

    expect(embeddingResponse.pipelineRunId).toMatch(/[0-9a-fA-F-]{36}/);
  });
});
