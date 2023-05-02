import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { OpenAIApi, Configuration } from "@gentrace/node/openai";
import { config } from "dotenv";

config();

describe("test_openai_embedding_pipeline", () => {
  const chatCompletionResponse = {
    choices: [
      {
        finish_reason: "stop",
        index: 0,
        message: {
          content: "Hello there! How can I assist you today?",
          role: "assistant",
        },
      },
    ],
    created: 1682626081,
    id: "chatcmpl-7A2CH4dc97AMoLbQe79QZhe4dh3y9",
    model: "gpt-3.5-turbo-0301",
    object: "chat.completion",
    usage: { completion_tokens: 10, prompt_tokens: 10, total_tokens: 20 },
  };

  const gentracePipelineRunResponse = {
    pipelineRunId: "1f2e8493-5fd1-4359-8cd7-867175d6d9aa",
  };

  let server: SetupServer;

  beforeAll(() => {
    server = setupServer(
      rest.post(
        "https://api.openai.com/v1/chat/completions",
        (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(chatCompletionResponse)
          );
        }
      ),

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

  it("should return pipelineRunId when chat completion is given a pipelineId", async () => {
    const openai = new OpenAIApi(
      new Configuration({
        gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
        apiKey: process.env.OPENAI_KEY,
      })
    );
    const chatCompletionResponse = await openai.createChatCompletion({
      messages: [
        {
          role: "user",
          contentTemplate: "Hello {{ name }}!",
          contentInputs: { name: "Vivek" },
        },
      ],
      model: "gpt-3.5-turbo",
      pipelineId: "testing-pipeline-id",
    });

    expect(chatCompletionResponse.pipelineRunId).toMatch(/[0-9a-fA-F-]{36}/);
  });

  it("should not return pipelineRunId when chat completion is not given a pipeline", async () => {
    const openai = new OpenAIApi(
      new Configuration({
        gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
        apiKey: process.env.OPENAI_KEY,
      })
    );
    const chatCompletionResponse = await openai.createChatCompletion({
      messages: [
        {
          role: "user",
          contentTemplate: "Hello {{ name }}!",
          contentInputs: { name: "Vivek" },
        },
      ],
      model: "gpt-3.5-turbo",
    });

    expect(chatCompletionResponse.pipelineRunId).toBeUndefined();
  });
});
