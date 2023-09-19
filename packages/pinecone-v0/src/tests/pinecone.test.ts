import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";
import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { PineconeClient, initPlugin } from "../index";
import { init, Pipeline } from "@gentrace/core";
import { DEFAULT_VECTOR } from "../fixtures";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("test_pinecone_completion_pipeline", () => {
  const completionResponse = {
    choices: [{ finish_reason: "stop", index: 0, text: "\n" }],
    created: 1682109134,
    id: "cmpl-77riQulvtyXo30e14QwSxzGATk2a5",
    model: "text-davinci-003",
    object: "text_completion",
    usage: { completion_tokens: 1, prompt_tokens: 3, total_tokens: 4 },
  };

  const gentracePipelineRunResponse = {
    pipelineRunId: "1f2e8493-5fd1-4359-8cd7-867175d6d9aa",
  };

  const pineconeProjectName = {
    project_name: "openai-trec",
  };

  const pineconeFetchResponse = {
    vector: [
      {
        id: "3890",
        values: DEFAULT_VECTOR,
        metadata: {
          testing: "value",
        },
      },
    ],
    namespace: "openai-trec",
  };

  let server: SetupServer;

  let interceptor = new FetchInterceptor();

  beforeAll(() => {
    interceptor.apply();

    interceptor.on("request", (request) => {
      if (
        request.url.href === "https://controller.dev.pinecone.io/actions/whoami"
      ) {
        return request.respondWith({
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pineconeProjectName),
        });
      } else if (
        request.url.href ===
        "https://openai-trec-openai-trec.svc.dev.pinecone.io/vectors/fetch?ids=3890"
      ) {
        return request.respondWith({
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pineconeFetchResponse),
        });
      }
    });

    server = setupServer(
      rest.post("https://api.openai.com/v1/completions", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(completionResponse),
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

  afterAll(async () => {
    await sleep(30);
    interceptor.dispose();
    server.close();
  });

  it("should work properly when using Pinecone wrapper simple module", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const pinecone = new PineconeClient();

    await pinecone.init({
      apiKey: "fake-api-key",
      environment: "dev",
    });

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      ids: ["3890"],
      gentrace: {
        userId: "user-id",
      },
    });

    expect(fetchResponse.pipelineRunId).not.toBeDefined();
  });

  it("should work properly when using fetch Pinecone wrapper simple module", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const pinecone = new PineconeClient();

    await pinecone.init({
      apiKey: "fake-api-key",
      environment: "dev",
    });

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      pipelineSlug: "my-slug",
      ids: ["3890"],
    });

    expect(fetchResponse.pipelineRunId).toBeDefined();
  });

  it("should work properly when using Pinecone wrapper advanced module", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const plugin = await initPlugin({
      apiKey: "fake-api-key",
      environment: "dev",
    });

    const pipeline = new Pipeline({
      slug: "pinecone-index-fetch-pipeline",
      plugins: {
        pinecone: plugin,
      },
    });

    const runner = pipeline.start();

    const pinecone = await runner.pinecone;

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      ids: ["3890"],
    });

    expect(fetchResponse.pipelineRunId).not.toBeDefined();
  });

  it("should work properly when using Pinecone wrapper advanced module (no pipeline run ID)", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const plugin = await initPlugin({
      apiKey: "fake-api-key",
      environment: "dev",
    });

    const pipeline = new Pipeline({
      slug: "pinecone-index-fetch-pipeline",
      plugins: {
        pinecone: plugin,
      },
    });

    const runner = pipeline.start();

    const pinecone = await runner.pinecone;

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      pipelineSlug: "my-slug",
      ids: ["3890"],
    });

    expect(fetchResponse.pipelineRunId).not.toBeDefined();

    const result = await runner.submit();

    expect(result.pipelineRunId).toBeDefined();
  });

  it("should work properly when using Pinecone wrapper advanced module (specify a context)", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const plugin = await initPlugin({
      apiKey: "fake-api-key",
      environment: "dev",
    });

    const pipeline = new Pipeline({
      slug: "pinecone-index-fetch-pipeline",
      plugins: {
        pinecone: plugin,
      },
    });

    const runner = pipeline.start({
      userId: "user-id",
    });

    const pinecone = await runner.pinecone;

    const index = await pinecone.Index("openai-trec");

    const fetchResponse = await index.fetch({
      pipelineSlug: "my-slug",
      ids: ["3890"],
    });

    expect(fetchResponse.pipelineRunId).not.toBeDefined();

    const result = await runner.submit();

    expect(result.pipelineRunId).toBeDefined();
  });
});