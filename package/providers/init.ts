import { Configuration as GentraceConfiguration } from "../configuration";
import { CoreApi } from "../api";

export let GENTRACE_API_KEY:
  | string
  | Promise<string>
  | ((name: string) => string)
  | ((name: string) => Promise<string>) = "";

export let GENTRACE_BASE_PATH = "";

export let GENTRACE_BRANCH = "";

export let GENTRACE_COMMIT = "";

export let globalGentraceConfig: GentraceConfiguration | null = null;

export let globalGentraceApi: CoreApi | null = null;

export function init({
  apiKey,
  basePath,
  branch,
  commit,
}: {
  apiKey:
    | string
    | Promise<string>
    | ((name: string) => string)
    | ((name: string) => Promise<string>);
  basePath?: string;
  branch?: string;
  commit?: string;
}) {
  if (!apiKey) {
    throw new Error("Gentrace API key not provided.");
  }

  GENTRACE_API_KEY = apiKey;

  if (basePath) {
    try {
      const url = new URL(basePath);
      if (url.pathname.startsWith("/api/v1")) {
      } else {
        throw new Error('Gentrace base path must end in "/api/v1".');
      }
    } catch (err) {
      throw new Error(`Invalid Gentrace base path: ${err.message}`);
    }

    GENTRACE_BASE_PATH = basePath;
  }

  globalGentraceConfig = new GentraceConfiguration({
    apiKey: GENTRACE_API_KEY,
    basePath: GENTRACE_BASE_PATH,
  });

  globalGentraceApi = new CoreApi(globalGentraceConfig);

  if (branch) {
    GENTRACE_BRANCH = branch;
  }

  if (commit) {
    GENTRACE_COMMIT = commit;
  }
}

export function deinit() {
  GENTRACE_API_KEY = "";
  GENTRACE_BASE_PATH = "";
  GENTRACE_BRANCH = "";
  GENTRACE_COMMIT = "";
  globalGentraceConfig = null;
  globalGentraceApi = null;
}
