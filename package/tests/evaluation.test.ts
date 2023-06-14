import stringify from "json-stable-stringify";
import { rest } from "msw";
import { deinit, init } from "../providers/init";
import { getTestCases, submitTestResults } from "../providers";
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
      expected: string | null;
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
        expected: null,
        inputs: { a: 1, b: 2 },
        name: "Test Case 1",
        setId: "12494e89-af19-4326-a12c-54e487337ecc",
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
      })
    );
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    deinit();
    jest.resetModules();
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
  });
});
