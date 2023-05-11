import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { Configuration, OpenAIApi } from "../openai";
import { config } from "dotenv";

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

  beforeAll(() => {
    server = setupServer(
      rest.post("https://api.openai.com/v1/embeddings", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(embeddingResponse)
        );
      }),
      rest.post("https://gentrace.ai/api/v1/pipeline-run", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(gentracePipelineRunResponse)
        );
      })
    );
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  it("should return pipelineRunId when embedding is passed", async () => {
    const openai = new OpenAIApi(
      new Configuration({
        gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
        apiKey: process.env.OPENAI_KEY,
      })
    );

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: "testing",
      pipelineId: "testing-pipeline-id",
    });

    expect(embeddingResponse.pipelineRunId).toMatch(/[0-9a-fA-F-]{36}/);
  });
});
