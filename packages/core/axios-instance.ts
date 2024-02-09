import globalAxios, { AxiosInstance } from "axios";
import fetchAdapter from "./adapters/fetch";

let axiosWithOptionalFetch: AxiosInstance;

// detect CF worker environment
if (typeof process === "undefined") {
  axiosWithOptionalFetch = globalAxios.create({
    // @ts-ignore
    adapter: fetchAdapter,
  });
} else {
  axiosWithOptionalFetch = globalAxios;
}

export default axiosWithOptionalFetch;
