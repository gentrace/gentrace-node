import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import OpenAI from "../openai";
import { init } from "../providers";
import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";
import { sleep } from "../providers/utils";

describe("test_openai_completion_pipeline", () => {
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
      rest.post("https://api.openai.com/v1/completions", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(completionResponse)
        );
      }),

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

  it("should return pipelineRunId when completion is given a pipelineId", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const openai = new OpenAI({
      apiKey: "openai-api-key",
    });

    const completionResponse = await openai.completions.create({
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: {
        company: "Google",
      },
      pipelineSlug: "test-completion-response",
    });

    expect(completionResponse.pipelineRunId).toMatch(/[0-9a-fA-F-]{36}/);
  });

  it("should not return pipelineRunId when completion is not given a pipeline", async () => {
    init({
      apiKey: "gentrace-api-key",
    });

    const openai = new OpenAI({
      apiKey: "openai-api-key",
    });

    const completionResponse = await openai.completions.create({
      model: "text-davinci-003",
      promptTemplate: "Write a brief summary of the history of {{ company }}: ",
      promptInputs: {
        company: "Google",
      },
    });

    expect(completionResponse.pipelineRunId).toBeUndefined();
  });
});
