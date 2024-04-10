import { Configuration as Configuration } from "../configuration";
import { V1Api, V2Api } from "../api";
import { getProcessEnv, setErrorInterceptor } from "./utils";

export let GENTRACE_API_KEY:
  | string
  | Promise<string>
  | ((name: string) => string)
  | ((name: string) => Promise<string>) = "";

export function getGentraceApiKey() {
  return GENTRACE_API_KEY;
}

export let GENTRACE_BASE_PATH = "";

export function getGentraceBasePath() {
  return GENTRACE_BASE_PATH;
}

export let GENTRACE_BRANCH = "";

export let GENTRACE_COMMIT = "";

export let GENTRACE_SHOW_CONNECTION_ERRORS = "";

// @deprecated: use GENTRACE_RESULT_NAME instead
export let GENTRACE_RUN_NAME = "";

export let GENTRACE_RESULT_NAME = "";

export let globalGentraceConfig: Configuration | null = null;

export let globalGentraceApi: V1Api | null = null;

export let globalGentraceApiV2: V2Api | null = null;

export let globalRequestBuffer: { [pipelineRunId: string]: Promise<any> } = {};

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
  showConnectionErrors?: string;

  // @deprecated: use resultName instead
  runName?: string;
  resultName?: string;
}) {
  const {
    apiKey,
    basePath,
    branch,
    commit,
    showConnectionErrors,
    runName,
    resultName,
  } = values ?? {};

  if (!apiKey && !getProcessEnv("GENTRACE_API_KEY")) {
    throw new Error(
      "Gentrace API key was provided neither by the `apiKey` param in the constructor nor by the `GENTRACE_API_KEY` env variable.",
    );
  }

  GENTRACE_API_KEY = apiKey || getProcessEnv("GENTRACE_API_KEY");

  GENTRACE_RUN_NAME = runName || getProcessEnv("GENTRACE_RUN_NAME");

  GENTRACE_RESULT_NAME = resultName || getProcessEnv("GENTRACE_RESULT_NAME");

  GENTRACE_SHOW_CONNECTION_ERRORS =
    showConnectionErrors || getProcessEnv("GENTRACE_SHOW_CONNECTION_ERRORS");

  setErrorInterceptor(GENTRACE_SHOW_CONNECTION_ERRORS);

  if (basePath) {
    try {
      const url = new URL(basePath);
      if (url.pathname.startsWith("/api")) {
      } else {
        throw new Error('Gentrace base path must end in "/api".');
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

  globalGentraceApi = new V1Api(globalGentraceConfig);

  globalGentraceApiV2 = new V2Api(globalGentraceConfig);

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
  GENTRACE_SHOW_CONNECTION_ERRORS = "";
  globalGentraceConfig = null;
  globalGentraceApi = null;
  globalRequestBuffer = {};
}

export async function flush() {
  return (await Promise.allSettled(Object.values(globalRequestBuffer))).every(
    (result) => result.status === "fulfilled",
  );
}
