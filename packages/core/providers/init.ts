import { Configuration as Configuration } from "../configuration";
import { CoreApi } from "../api";
import { getProcessEnv } from "./utils";

export let GENTRACE_API_KEY:
  | string
  | Promise<string>
  | ((name: string) => string)
  | ((name: string) => Promise<string>) = "";

export let GENTRACE_BASE_PATH = "";

export let GENTRACE_BRANCH = "";

export let GENTRACE_COMMIT = "";

export let GENTRACE_RUN_NAME = "";

export let globalGentraceConfig: Configuration | null = null;

export let globalGentraceApi: CoreApi | null = null;

export let resetGlobalGentraceApi = () => {
  globalGentraceConfig = null;
};

export function init(values?: {
  apiKey?:
    | string
    | Promise<string>
    | ((name: string) => string)
    | ((name: string) => Promise<string>);
  basePath?: string;
  branch?: string;
  commit?: string;
  runName?: string;
}) {
  const { apiKey, basePath, branch, commit, runName } = values ?? {};

  if (!apiKey && !getProcessEnv("GENTRACE_API_KEY")) {
    throw new Error(
      "Gentrace API key was provided neither by the `apiKey` param in the constructor nor by the `GENTRACE_API_KEY` env variable.",
    );
  }

  GENTRACE_API_KEY = apiKey || getProcessEnv("GENTRACE_API_KEY");

  GENTRACE_RUN_NAME = runName || getProcessEnv("GENTRACE_RUN_NAME");

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

  globalGentraceConfig = new Configuration({
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
