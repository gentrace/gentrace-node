import { Configuration, OpenAIApi } from "../openai";
import { init } from "../providers";

describe("Usage of OpenAIApi", () => {
  describe("constructor", () => {
    it("should create an instance when configuration params are deprecated but still valid (gentrace.ai host)", () => {
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
        init({
          apiKey: "gentrace-api-key",
        });
        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (staging.gentrace.ai host)", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
          basePath: "https://staging.gentrace.ai/api/v1",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (localhost + port host)", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
          basePath: "http://localhost:3000/api/v1",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid (no host)", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).not.toThrow();
    });

    it("should create an instance when configuration is valid", () => {
      init({
        apiKey: "gentrace-api-key",
        basePath: "https://gentrace.ai/api/v1",
      });

      const openai = new OpenAIApi(
        new Configuration({
          apiKey: "openai-api-key",
        })
      );
      expect(openai).toBeDefined();
    });

    it("should throw an error when API key is absent", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
          basePath: "https://gentrace.ai/api/v1",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "",
          })
        );
      }).toThrow("API key not provided.");
    });

    it("should throw an error when Gentrace API key is absent", () => {
      expect(() => {
        init({
          apiKey: "",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).toThrow("Gentrace API key not provided.");
    });

    it("should throw an error when Gentrace base path is invalid", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
          basePath: "invalid-url",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).toThrow("Invalid Gentrace base path");
    });

    it("should throw an error when Gentrace base path does not end in /api/v1", () => {
      expect(() => {
        init({
          apiKey: "gentrace-api-key",
          basePath: "https://gentrace.ai/invalid-path",
        });

        new OpenAIApi(
          new Configuration({
            apiKey: "openai-api-key",
          })
        );
      }).toThrow('Gentrace base path must end in "/api/v1".');
    });
  });
});
