import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { Configuration, OpenAIApi } from "../openai";
import { config } from "dotenv";
import { deinit, init } from "../providers/init";
import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";
import { sleep } from "../providers/utils";

config();

describe("test_openai_chat_completion_pipeline", () => {
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

      // Designed for old axios native handler calls
      rest.post("https://gentrace.ai/api/v1/run", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(gentracePipelineRunResponse)
        );
      })
    );
    server.listen();
  });

  afterAll(async () => {
    await sleep(30);
    interceptor.dispose();
    server.close();
  });

  beforeEach(() => {
    deinit();
    jest.resetModules();
  });

  it("should return pipelineRunId when chat completion is given a pipelineId", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: "openai-api-key",
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
    init({
      apiKey: "gentrace-api-key",
    });

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: "openai-api-key",
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
