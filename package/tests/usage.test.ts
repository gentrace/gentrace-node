import { Configuration, OpenAIApi } from "@gentrace/node/openai";

describe("Usage of OpenAIApi", () => {
  describe("constructor", () => {
    it("should create an instance when configuration is valid (gentrace.ai host)", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "https://gentrace.ai/api/v1/pipeline-run",
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (gentrace.ai host)", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (staging.gentrace.ai host)", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "https://staging.gentrace.ai/api/v1/pipeline-run",
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (localhost + port host)", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "http://localhost:3000/api/v1/pipeline-run",
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (no host)", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid", () => {
      const openai = new OpenAIApi(
        new Configuration({
          gentraceApiKey: "gentrace-api-key",
          gentraceBasePath: "https://gentrace.ai/api/v1",
          apiKey: "openai-api-key",
        })
      );
      expect(openai).toBeDefined();
    });

    it("should throw an error when API key is absent", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "https://gentrace.ai/api/v1",
            apiKey: "",
          })
        );
      }).toThrow("API key not provided.");
    });

    it("should throw an error when Gentrace API key is absent", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "",
            gentraceBasePath: "https://gentrace.ai/api/v1",
            apiKey: "openai-api-key",
          })
        );
      }).toThrow("Gentrace API key not provided.");
    });

    it("should throw an error when Gentrace base path is invalid", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "invalid-url",
            apiKey: "openai-api-key",
          })
        );
      }).toThrow("Invalid Gentrace base path");
    });

    it("should throw an error when Gentrace base path does not end in /api/v1", () => {
      expect(() => {
        new OpenAIApi(
          new Configuration({
            gentraceApiKey: "gentrace-api-key",
            gentraceBasePath: "https://gentrace.ai/invalid-path",
            apiKey: "openai-api-key",
          })
        );
      }).toThrow('Gentrace base path must end in "/api/v1".');
    });
  });
});
