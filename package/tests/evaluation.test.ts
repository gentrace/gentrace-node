import stringify from "json-stable-stringify";
import { rest } from "msw";
import { deinit, init } from "../providers/init";
import {
  constructSubmissionPayload,
  getTestCases,
  getTestSets,
  submitTestResults,
} from "../providers";
import { setupServer, SetupServer } from "msw/node";

describe("Usage of Evaluation functionality", () => {
  let server: SetupServer;

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
      setId: string;
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
        setId: "12494e89-af19-4326-a12c-54e487337ecc",
      },
    ],
  };

  let getFullTestSetsResponse: {
    testSets: {
      id: string;
      createdAt: string;
      updatedAt: string;
      archivedAt: string | null;
      labels: string[];
      name: string;
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
        setId: string;
      }[];
    }[];
  } = {
    testSets: [
      {
        id: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
        createdAt: "2023-07-18T11:08:09.842Z",
        updatedAt: "2023-07-18T11:08:09.842Z",
        archivedAt: null,
        labels: ["guessing"],
        name: "Guess the Year",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
        ],
      },
      {
        id: "393e926e-ba1b-486f-8cbe-db7d9471fe56",
        createdAt: "2023-07-18T12:47:58.618Z",
        updatedAt: "2023-07-18T12:47:58.618Z",
        archivedAt: null,
        labels: [],
        name: "Testign",
        organizationId: "fe05eab7-4f07-530d-8ed9-15aeae86e0db",
        branch: "main",
        cases: [],
      },
    ],
  };

  let getFilteredTestSetsResponse: {
    testSets: {
      id: string;
      createdAt: string;
      updatedAt: string;
      archivedAt: string | null;
      labels: string[];
      name: string;
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
        setId: string;
      }[];
    }[];
  } = {
    testSets: [
      {
        id: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
        createdAt: "2023-07-18T11:08:09.842Z",
        updatedAt: "2023-07-18T11:08:09.842Z",
        archivedAt: null,
        labels: ["guessing"],
        name: "Guess the Year",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
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
            setId: "9685b34e-2cac-5bd2-8751-c9e34ff9fd98",
          },
        ],
      },
    ],
  };

  beforeAll(() => {
    server = setupServer(
      rest.post("https://gentrace.ai/api/v1/test-run", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(createTestRunResponse)
        );
      }),
      rest.get("https://gentrace.ai/api/v1/test-case", (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(getTestCasesResponse)
        );
      }),
      rest.get("https://gentrace.ai/api/v1/test-sets", (req, res, ctx) => {
        const label = req.url.searchParams.get("label");

        console.log("label params", label);

        if (label) {
          return res(
            ctx.status(200),
            ctx.set("Content-Type", "application/json"),
            ctx.json(getFilteredTestSetsResponse)
          );
        }

        return res(
          ctx.status(200),
          ctx.set("Content-Type", "application/json"),
          ctx.json(getFullTestSetsResponse)
        );
      })
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

      const testCases = await getTestCases("set-id");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases)
      );

      const submissionResponse = await submitTestResults("set-id", testCases, [
        "This are some outputs",
      ]);
      expect(submissionResponse.runId).toBe(createTestRunResponse.runId);
    });

    it("should create an instance when configuration is valid (gentrace.ai host)", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("set-id");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases)
      );

      const submissionResponse = await submitTestResults("set-id", testCases, [
        "This are some outputs",
      ]);
      expect(submissionResponse.runId).toBe(createTestRunResponse.runId);
    });

    it("should fails when parameters do not match", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("set-id");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases)
      );

      expect(submitTestResults("set-id", testCases, [])).rejects.toThrow(
        "The number of test cases must be equal to the number of outputs."
      );
    });

    it("should create an instance when output steps are provided", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testCases = await getTestCases("set-id");

      expect(testCases.length).toBe(1);

      expect(stringify(testCases)).toBe(
        stringify(getTestCasesResponse.testCases)
      );

      const submissionResponse = await submitTestResults(
        "set-id",
        testCases,
        ["This are some outputs"],
        [
          [
            {
              key: "compose",
              output: "This are some outputs",
            },
          ],
        ]
      );
      expect(submissionResponse.runId).toBe(createTestRunResponse.runId);
    });

    it("should return test sets when invoking the /api/v1/test-sets API", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const testSets = await getTestSets();

      expect(testSets.length).toBe(2);

      expect(stringify(testSets)).toBe(
        stringify(getFullTestSetsResponse.testSets)
      );
    });

    it("should return filtered test sets when invoking the /api/v1/test-sets API", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const filteredTestSets = await getTestSets({
        label: "guessing",
      });

      expect(filteredTestSets.length).toBe(1);

      expect(stringify(filteredTestSets)).toBe(
        stringify(getFilteredTestSetsResponse.testSets)
      );
    });

    it("should properly construct the branch and commit values", async () => {
      process.env.GENTRACE_BRANCH = "test-branch";
      process.env.GENTRACE_COMMIT = "test-commit";

      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const payload = constructSubmissionPayload("set-id", []);

      expect(payload.branch).toBe("test-branch");
      expect(payload.commit).toBe("test-commit");
    });

    it("should properly leave the branch and commit values undefined", async () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const payload = constructSubmissionPayload("set-id", []);

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

      const payload = constructSubmissionPayload("set-id", []);

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

      const payload = constructSubmissionPayload("set-id", []);

      expect(payload.branch).toBe("test-branch-init");
      expect(payload.commit).toBe("test-commit-init");
    });
  });
});
