import { CoreApi } from "../api";
import { Configuration as GentraceConfiguration } from "../configuration";
import { TestRunPostRequestTestResultsInner } from "../models";

type TestResult = TestRunPostRequestTestResultsInner;

export class Evaluation {
  public config: GentraceConfiguration;
  public api: CoreApi;

  constructor({
    apiKey,
    basePath,
  }: {
    apiKey:
      | string
      | Promise<string>
      | ((name: string) => string)
      | ((name: string) => Promise<string>);
    basePath?: string;
  }) {
    this.config = new GentraceConfiguration({
      apiKey,
      basePath,
    });

    this.api = new CoreApi(this.config);
  }

  async getTestCases(setId: string) {
    const response = await this.api.testCaseGet(setId);
    return response.data;
  }

  async submitTestResults(
    setId: string,
    source: string,
    testResults: TestResult[]
  ) {
    const response = await this.api.testRunPost({
      setId,
      source,
      testResults,
    });
    return response.data;
  }
}
