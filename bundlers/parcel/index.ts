import { Configuration, OpenAIApi } from "@gentrace/node/openai";

const handle = new OpenAIApi(
  new Configuration({
    gentraceApiKey: process.env.GENTRACE_API_KEY ?? "",
    apiKey: process.env.OPENAI_KEY,
  })
);
