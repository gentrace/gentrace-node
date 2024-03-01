import { resetGlobalGentraceApi } from "../providers/init";
import { getParamNames } from "../providers/utils";

describe("Parser tests for param extraction", () => {
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = OLD_ENV;
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = {};
    resetGlobalGentraceApi();
  });

  describe("constructor", () => {
    it("should get all named identifiers", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames((a: string, b: number, c: boolean) => {
        return a;
      });

      const expected = ["a", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should create placeholder name for destructured value", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        ({ another }: { another: string }, b: number, c: boolean) => {
          return another;
        },
      );

      const expected = ["param0", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should create placeholder name for destructured value with assigned default value", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        (
          { another }: { another: string } = { another: "Testing" },
          b: number,
          c: boolean,
        ) => {
          return another;
        },
      );

      const expected = ["param0", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if there's a default value assigned", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        (a = { another: "Testing" }, b: number, c: boolean) => {
          return a;
        },
      );

      const expected = ["a", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if it's async", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        async (a = { another: "Testing" }, b: number, c: boolean) => {
          return a;
        },
      );

      const expected = ["a", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if it's single param with no parens", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        // prettier-ignore
        a => {
          return a;
        },
      );

      const expected = ["a"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if it's async and single param with no parens", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(
        // prettier-ignore
        async a => {
          return a;
        },
      );

      const expected = ["a"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if it's non-lambda, async", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(async function (a) {
        return a;
      });

      const expected = ["a"];
      expect(params).toEqual(expected);
    });

    it("should still get identifier if it's non-lambda, async", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(async function (a, b, c) {
        return a;
      });

      const expected = ["a", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifiers if it's non-lambda, 3 params, 1 destructured, async", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(async function ({ a }, b, c) {
        return a;
      });

      const expected = ["param0", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifiers if it's non-lambda, 3 params, 1 destructured, sync", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(function ({ a }, b, c) {
        return a;
      });

      const expected = ["param0", "b", "c"];
      expect(params).toEqual(expected);
    });

    it("should still get identifiers if it's non-lambda, 0 params, sync", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(function () {});

      const expected: any[] = [];
      expect(params).toEqual(expected);
    });

    it("should still get identifiers if it's lambda, 0 params, sync", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      const params = getParamNames(() => {});

      const expected: any[] = [];
      expect(params).toEqual(expected);
    });

    it("should get empty array if a function isn't passed in", () => {
      process.env.GENTRACE_API_KEY = "some-test-api-key";
      // @ts-ignore
      const params = getParamNames("sdlkjf");

      const expected: any[] = [];
      expect(params).toEqual(expected);
    });
  });
});
