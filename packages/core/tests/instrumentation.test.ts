import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";
import stringify from "json-stable-stringify";
import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import { init, Pipeline, PipelineRun } from "../providers";
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

    interceptor.on("request", (handle) => {
      handle.respondWith({
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

  afterAll(() => {
    server.close();
  });

  it("should have the correct number of step runs in a pipeline for checkpoint function", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    runner.checkpoint({
      inputs: {
        a: 1,
        b: 2,
      },
      outputs: {
        value: "Testing",
      },
    });

    expect(runner.stepRuns.length).toEqual(1);
  });

  it("should use the previous end time as the start time", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    runner.checkpoint({
      inputs: {
        a: 1,
        b: 2,
      },
      outputs: {
        value: "Testing",
      },
    });

    expect(runner.stepRuns.length).toEqual(1);

    runner.checkpoint({
      inputs: {
        a: 1,
        b: 2,
      },
      outputs: {
        value: "Testing",
      },
    });

    expect(runner.stepRuns[0].endTime).toEqual(runner.stepRuns[1].startTime);
  });

  it("should have all the default params specified with checkout()", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    runner.checkpoint({
      inputs: {
        a: 1,
        b: 2,
      },
      outputs: {
        value: "Testing",
      },
    });

    expect(runner.stepRuns.length).toEqual(1);

    const first = runner.stepRuns[0];
    expect(first.elapsedTime).toEqual(0);

    expect(first.invocation).toEqual("undeclared");
    expect(first.provider).toEqual("undeclared");
  });

  it("should have all params specified with measure()", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    const result = await runner.measure(
      (a, b) => {
        return a + b;
      },
      [1, 2],
    );

    expect(result).toEqual(3);

    expect(runner.stepRuns.length).toEqual(1);

    const first = runner.stepRuns[0];
    expect(stringify(first.outputs)).toBe(stringify({ value: 3 }));
  });

  it("should have steps that reflect the custom params that are passed into the step", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    const result = await runner.measure(
      (a, b) => {
        return a + b;
      },
      [1, 2],
      {
        modelParams: { b: 5 },
        invocation: "customAddition",
      },
    );

    expect(result).toEqual(3);

    expect(runner.stepRuns.length).toEqual(1);

    const first = runner.stepRuns[0];
    expect(stringify(first.outputs)).toBe(stringify({ value: 3 }));
    expect(stringify(first.modelParams)).toBe(stringify({ b: 5 }));

    expect(first.invocation).toEqual("customAddition");
    expect(first.provider).toEqual("undeclared");
  });

  it("should have steps with proper time spacing", async () => {
    init({
      apiKey: "api-key",
    });

    const pipeline = new Pipeline({
      slug: "create-completion-pipeline",
    });

    const runner = new PipelineRun({
      pipeline,
    });

    const result = await runner.measure(
      async (a, b) => {
        await sleep(1000);
        return a + b;
      },
      [1, 2],
      {
        modelParams: { b: 5 },
        invocation: "customAddition",
      },
    );

    expect(runner.stepRuns.length).toEqual(1);

    const first = runner.stepRuns[0];

    expect(first.elapsedTime).toBeGreaterThanOrEqual(1000);
  });
});
