import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { OpenAIApi, Configuration } from "@gentrace/node/openai";
import { config } from "dotenv";

config();

describe("test_openai_embedding_pipeline", () => {
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

  let server: SetupServer;

  beforeAll(() => {
    server = setupServer(
      rest.post("https://api.openai.com/v1/completions", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(completionResponse)
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

  it("should return pipelineRunId when completion is given a pipelineId", async () => {
    const openai = new OpenAIApi(
      new Configuration({
        gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
        apiKey: process.env.OPENAI_KEY,
      })
    );

    const completionResponse = await openai.createCompletion({
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: {
        company: "Google",
      },
      pipelineId: "test-completion-response",
    });

    expect(completionResponse.pipelineRunId).toMatch(/[0-9a-fA-F-]{36}/);
  });

  it("should not return pipelineRunId when completion is not given a pipeline", async () => {
    const openai = new OpenAIApi(
      new Configuration({
        gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
        apiKey: process.env.OPENAI_KEY,
      })
    );
    const completionResponse = await openai.createCompletion({
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: {
        company: "Google",
      },
    });

    expect(completionResponse.pipelineRunId).toBeUndefined();
  });
});
