import stringify from "json-stable-stringify";
import { rest } from "msw";
import { deinit, init } from "../providers/init";
import {
  constructSubmissionPayload,
  getTestCases,
  getPipelines,
  runTest,
  submitTestResult,
  Pipeline,
  PipelineRun,
  createTestCase,
  createTestCases,
  updateTestCase,
} from "../providers";
import { setupServer, SetupServer } from "msw/node";
import { getTestCounter } from "../providers/utils";
import { FetchInterceptor } from "@mswjs/interceptors/lib/interceptors/fetch";

describe("Usage of Evaluation functionality", () => {
  let server: SetupServer;

  let createTestResultResponse = {
    resultId: "993F25D8-7B54-42E2-A50D-D143BCE1C5C4",
  };

  let createTestRunResponse = {
    runId: "993F25D8-7B54-42E2-A50D-D143BCE1C5C4",
  };

  let getTestCasesResponse: {
    testCases: {
      id: string;
      createdAt: string;
      updatedAt: string;
      archivedAt: string | null;
      expectedOutputs: null | Record<string, any>;
      inputs: Record<string, any>;
      name: string;
      pipelineId: string;
    }[];
  } = {
    testCases: [
      {
        id: "87cca81f-f466-4433-a0d2-695c06d1355a",
        createdAt: "2023-05-25T16:35:31.470Z",
        updatedAt: "2023-05-25T16:35:31.470Z",
        archivedAt: null,
        expectedOutputs: { value: "This is some output" },
        inputs: { a: 1, b: 2 },
        name: "Test Case 1",
        pipelineId: "12494e89-af19-4326-a12c-54e487337ecc",
      },
    ],
  };

  let createSingleCaseResponse = {
    caseId: "87cca81f-f466-4433-a0d2-695c06d1355a",
  };

  let createMultipleCasesResponse = {
    creationCount: 2,
  };

  let updateTestCaseResponse = {
    caseId: "87cca81f-f466-4433-a0d2-695c06d1355a",
  };

  let getFullPipelinesResponse: {
    pipelines: {
      id: string;
      createdAt: string;
      updatedAt: string;
      archivedAt: string | null;
      labels: string[];
      name: string;
      slug: string;
      displayName: string;
      organizationId: string;
      branch: string;
      cases: {
        id: string;
        createdAt: string;
        updatedAt: string;
        archivedAt: string | null;
        expectedOutputs: null | Record<string, any>;
        inputs: Record<string, any>;
        name: string;
        pipelineId: string;
      }[];
    }[];
  } = {
    pipelines: [
      {
        id: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
        createdAt: "2023-07-18T11:08:09.842Z",
        updatedAt: "2023-07-18T11:08:09.842Z",
        archivedAt: null,
        labels: ["guessing"],
        name: null,
        slug: "guess-the-year",
        displayName: "Guess the Year",
        organizationId: "fe05eab7-4f07-530d-8ed9-15aeae86e0db",
        branch: "main",
        cases: [
          {
            id: "316c3797-7d04-54f9-91f0-8af87e1c8413",
            createdAt: "2023-07-18T11:08:09.863Z",
            updatedAt: "2023-07-18T11:08:09.863Z",
            archivedAt: null,
            expectedOutputs: { value: "2023" },
            inputs: {
              query: "In what year was the Apple Vision Pro released?",
            },
            name: "Apple Vision Pro released",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
          {
            id: "a2bddcbc-51ac-5831-be0d-5868a7ffa1db",
            createdAt: "2023-07-18T11:08:09.861Z",
            updatedAt: "2023-07-18T11:08:09.861Z",
            archivedAt: null,
            expectedOutputs: { value: "2022" },
            inputs: {
              query: "In what year was ChatGPT released?",
            },
            name: "ChatGPT released",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
          {
            id: "275d92ac-db8a-5964-846d-c8a7bc3caf4d",
            createdAt: "2023-07-18T11:08:09.858Z",
            updatedAt: "2023-07-18T11:08:09.858Z",
            archivedAt: null,
            expectedOutputs: { value: "2023" },
            inputs: {
              query: "In what year was Gentrace founded?",
            },
            name: "Gentrace founded",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
        ],
      },
      {
        id: "393e926e-ba1b-486f-8cbe-db7d9471fe56",
        createdAt: "2023-07-18T12:47:58.618Z",
        updatedAt: "2023-07-18T12:47:58.618Z",
        archivedAt: null,
        labels: [],
        name: null,
        slug: "testign",
        displayName: "Testign",
        organizationId: "fe05eab7-4f07-530d-8ed9-15aeae86e0db",
        branch: "main",
        cases: [],
      },
    ],
  };

  let getFilteredPipelinesResponse: {
    pipelines: {
      id: string;
      createdAt: string;
      updatedAt: string;
      archivedAt: string | null;
      labels: string[];
      name: string;
      slug: "guess-the-year";
      organizationId: string;
      branch: string;
      cases: {
        id: string;
        createdAt: string;
        updatedAt: string;
        archivedAt: string | null;
        expectedOutputs: null | Record<string, any>;
        inputs: Record<string, any>;
        name: string;
        pipelineId: string;
      }[];
    }[];
  } = {
    pipelines: [
      {
        id: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
        createdAt: "2023-07-18T11:08:09.842Z",
        updatedAt: "2023-07-18T11:08:09.842Z",
        archivedAt: null,
        labels: ["guessing"],
        name: "Guess the Year",
        slug: "guess-the-year",
        organizationId: "fe05eab7-4f07-530d-8ed9-15aeae86e0db",
        branch: "main",
        cases: [
          {
            id: "316c3797-7d04-54f9-91f0-8af87e1c8413",
            createdAt: "2023-07-18T11:08:09.863Z",
            updatedAt: "2023-07-18T11:08:09.863Z",
            archivedAt: null,
            expectedOutputs: { value: "2023" },
            inputs: {
              query: "In what year was the Apple Vision Pro released?",
            },
            name: "Apple Vision Pro released",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
          {
            id: "a2bddcbc-51ac-5831-be0d-5868a7ffa1db",
            createdAt: "2023-07-18T11:08:09.861Z",
            updatedAt: "2023-07-18T11:08:09.861Z",
            archivedAt: null,
            expectedOutputs: { value: "2022" },
            inputs: {
              query: "In what year was ChatGPT released?",
            },
            name: "ChatGPT released",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
          {
            id: "275d92ac-db8a-5964-846d-c8a7bc3caf4d",
            createdAt: "2023-07-18T11:08:09.858Z",
            updatedAt: "2023-07-18T11:08:09.858Z",
            archivedAt: null,
            expectedOutputs: { value: "2023" },
            inputs: {
              query: "In what year was Gentrace founded?",
            },
            name: "Gentrace founded",
            pipelineId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
        ],
      },
    ],
  };

  let interceptor = new FetchInterceptor();

  beforeAll(() => {
    interceptor.apply();

    interceptor.on("request", (request) => {
      let body: string = "";

      if (request.url.href === "https://gentrace.ai/api/v1/test-result") {
        body = JSON.stringify(createTestResultResponse);
      }
      if (
        request.url.href === "https://gentrace.ai/api/v1/test-result-simple"
      ) {
        body = JSON.stringify(createTestResultResponse);
      }
      if (
        request.method === "GET" &&
        request.url.href.includes("https://gentrace.ai/api/v1/test-case")
      ) {
        body = JSON.stringify(getTestCasesResponse);
      }
      if (
        request.method === "POST" &&
        request.url.href.includes("https://gentrace.ai/api/v1/test-case")
      ) {
        body = JSON.stringify(createSingleCaseResponse);
      }
      if (
        request.method === "POST" &&
        request.url.href.includes("https://gentrace.ai/api/v1/test-case")
      ) {
        body = JSON.stringify(createMultipleCasesResponse);
      }

      if (
        request.method === "PATCH" &&
        request.url.href.includes("https://gentrace.ai/api/v1/test-case")
      ) {
        body = JSON.stringify(updateTestCaseResponse);
      }

      if (request.url.href.includes("https://gentrace.ai/api/v1/pipelines")) {
        const label = request.url.searchParams.get("label");
        if (label) {
          body = JSON.stringify(getFilteredPipelinesResponse);
        } else {
          body = JSON.stringify(getFullPipelinesResponse);
        }
      }

      request.respondWith({
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
    });

    server = setupServer(
      rest.post("https://gentrace.ai/api/v1/test-result", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(createTestResultResponse),
        );
      }),
      rest.post(
        "https://gentrace.ai/api/v1/test-result-simple",
        (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(createTestResultResponse),
          );
        },
      ),
      rest.get("https://gentrace.ai/api/v1/test-case", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(getTestCasesResponse),
        );
      }),
      rest.post(
        "https://gentrace.ai/api/v1/test-case",
        async (req, res, ctx) => {
          const payload = await req.json();

          if (payload.testCases) {
            return res(
              ctx.status(200),
              ctx.set("Content-Type", "application/json"),
              ctx.json(createMultipleCasesResponse),
            );
          }

          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(createSingleCaseResponse),
          );
        },
      ),
      rest.patch(
        "https://gentrace.ai/api/v1/test-case",
        async (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(updateTestCaseResponse),
          );
        },
      ),
      rest.get("https://gentrace.ai/api/v1/pipelines", (req, res, ctx) => {
        const label = req.url.searchParams.get("label");

        if (label) {
          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(getFilteredPipelinesResponse),
          );
        }

        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(getFullPipelinesResponse),
        );
      }),
    );
    server.listen();
  });

  afterAll(() => {
    server.close();
    process.env = OLD_ENV;
  });

  const OLD_ENV = process.env;

  beforeEach(() => {
    deinit();
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  describe("constructor", () => {
    it("should create an instance when configuration is valid (gentrace.ai host)", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("guess-the-year");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases),
      );

      const submissionResponse = await submitTestResult(
        "guess-the-year",
        testCases,
        [{ value: "This are some outputs" }],
      );

      // The API endpoint will return runId instead of resultId since it's deprecated
      expect(submissionResponse.resultId).toBe(
        createTestResultResponse.resultId,
      );
    });

    it("should create an instance when configuration is valid (gentrace.ai host)", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("guess-the-year");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases),
      );

      const submissionResponse = await submitTestResult(
        "guess-the-year",
        testCases,
        [{ value: "This are some outputs" }],
      );
      expect(submissionResponse.resultId).toBe(
        createTestResultResponse.resultId,
      );
    });

    it("should pass if a UUID is directly passed", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("guess-the-year");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases),
      );

      const submissionResponse = await submitTestResult(
        "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
        testCases,
        [{ value: "This are some outputs" }],
      );
      expect(submissionResponse.resultId).toBe(
        createTestResultResponse.resultId,
      );
    });

    it("should fails when parameters do not match", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("guess-the-year");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases),
      );

      expect(submitTestResult("pipeline-id", testCases, [])).rejects.toThrow(
        "The number of test cases must be equal to the number of outputs.",
      );
    });

    it("should give case ID if creating single test case", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const singleCase = await createTestCase({
        pipelineSlug: "guess-the-year",
        name: "Test Case 1",
        inputs: { a: 1, b: 2 },
        expectedOutputs: { value: "This is some output" },
      });

      expect(singleCase).toBe(createSingleCaseResponse.caseId);
    });

    it("should give case ID if creating multiple test cases", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const creationCount = await createTestCases({
        pipelineSlug: "guess-the-year",
        testCases: [
          {
            name: "Test Case 1",
            inputs: { a: 1, b: 2 },
            expectedOutputs: { value: "This is some output" },
          },
          {
            name: "Test Case 2",
            inputs: { a: 1, b: 2 },
            expectedOutputs: { value: "This is some output" },
          },
        ],
      });

      expect(creationCount).toBe(2);
    });

    it("should give case ID if updating test case", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const caseId = await updateTestCase({
        id: "87cca81f-f466-4433-a0d2-695c06d1355a",
        name: "Test Case 1",
        inputs: { a: 1, b: 2 },
        expectedOutputs: { value: "This is some output" },
      });

      expect(caseId).toBe("87cca81f-f466-4433-a0d2-695c06d1355a");
    });

    it("should return pipelines when invoking the /api/v1/pipelines API", async () => {
      init({
        apiKey: "gentrace-api-key",
      });

      const pipelines = await getPipelines();

      expect(pipelines.length).toBe(2);

      expect(stringify(pipelines)).toBe(
        stringify(getFullPipelinesResponse.pipelines),
      );
    });

    it("should return filtered pipelines when invoking the /api/v1/pipelines API", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const filteredPipelines = await getPipelines({
        label: "guessing",
      });

      expect(filteredPipelines.length).toBe(1);

      expect(stringify(filteredPipelines)).toBe(
        stringify(getFilteredPipelinesResponse.pipelines),
      );
    });

    it("should properly construct the branch and commit values", async () => {
      process.env.GENTRACE_BRANCH = "test-branch";
      process.env.GENTRACE_COMMIT = "test-commit";

      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const payload = constructSubmissionPayload("pipeline-id", []);

      expect(payload.branch).toBe("test-branch");
      expect(payload.commit).toBe("test-commit");
    });

    it("should properly leave the branch and commit values undefined", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const payload = constructSubmissionPayload("pipeline-id", []);

      expect(payload.branch).toBeUndefined();
      expect(payload.commit).toBeUndefined();
    });

    it("should properly define the branch and commit values if defined in init()", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
        branch: "test-branch",
        commit: "test-commit",
      });

      const payload = constructSubmissionPayload("pipeline-id", []);

      expect(payload.branch).toBe("test-branch");
      expect(payload.commit).toBe("test-commit");
    });

    it("should prioritize the branch and commit values defined in the init() if both env and init() are defined", async () => {
      process.env.GENTRACE_BRANCH = "test-branch-env";
      process.env.GENTRACE_COMMIT = "test-commit-env";

      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
        branch: "test-branch-init",
        commit: "test-commit-init",
      });

      const payload = constructSubmissionPayload("pipeline-id", []);

      expect(payload.branch).toBe("test-branch-init");
      expect(payload.commit).toBe("test-commit-init");
    });

    it("should create a body with a `runner` submission variable", async () => {
      process.env.GENTRACE_BRANCH = "test-branch-env";
      process.env.GENTRACE_COMMIT = "test-commit-env";

      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
        branch: "test-branch-init",
        commit: "test-commit-init",
      });

      const payload = constructSubmissionPayload("pipeline-id", []);

      expect(payload.collectionMethod).toBe("runner");
    });
  });

  it("should properly handle runTest() result submissions", async () => {
    const slug = "guess-the-year";

    init({
      apiKey: "api-key",
    });

    await runTest(slug, async (testCase) => {
      const pipeline = new Pipeline({
        slug: slug,
      });

      const runner = pipeline.start();

      const result = await runner.measure(
        async (a, b) => {
          return a + b;
        },
        [1, 2],
        {
          modelParams: { b: 5 },
          invocation: "customAddition",
          context: {
            render: {
              type: "html",
              key: "a",
            },
          },
        },
      );

      return [result, runner];
    });
  });

  it("should properly increment and decrement counter", async () => {
    const slug = "guess-the-year";

    init({
      apiKey: "api-key",
    });

    expect(getTestCounter()).toBe(0);

    await runTest(slug, async (testCase) => {
      const pipeline = new Pipeline({
        slug: slug,
      });

      const runner = pipeline.start();

      const result = await runner.measure(
        async (a, b) => {
          return a + b;
        },
        [1, 2],
        {
          modelParams: { b: 5 },
          invocation: "customAddition",
        },
      );

      return [result, runner];
    });

    expect(getTestCounter()).toBe(0);
  });

  it("should throw if slug is not found", async () => {
    const slug = "not-available";

    init({
      apiKey: "api-key",
    });

    expect(
      runTest(slug, async (testCase) => {
        const pipeline = new Pipeline({
          slug: slug,
        });

        const runner = pipeline.start();

        const result = await runner.measure(
          async (a, b) => {
            return a + b;
          },
          [1, 2],
          {
            modelParams: { b: 5 },
            invocation: "customAddition",
          },
        );

        return [result, runner];
      }),
    ).rejects.toThrow("Could not find the specified pipeline (not-available)");
  });

  it("should throw if slug is not found and reset counter appropriately", async () => {
    const slug = "not-available";

    init({
      apiKey: "api-key",
    });

    await expect(
      runTest(slug, async (testCase) => {
        const pipeline = new Pipeline({
          slug: slug,
        });

        const runner = pipeline.start();

        const result = await runner.measure(
          async (a, b) => {
            return a + b;
          },
          [1, 2],
          {
            modelParams: { b: 5 },
            invocation: "customAddition",
          },
        );

        return [result, runner];
      }),
    ).rejects.toThrow("Could not find the specified pipeline (not-available)");

    expect(getTestCounter()).toBe(0);
  });
});
