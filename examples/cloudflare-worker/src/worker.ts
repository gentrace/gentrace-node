import { init } from "@gentrace/core";
import { OpenAI } from "@gentrace/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { env } from "node:process";

// Initialize Gentrace
init({
  apiKey: env.GENTRACE_API_KEY,
});

// Use Gentrace's OpenAI wrapper
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

const GENTRACE_PIPELINE_SLUG = "testing-pipeline-id";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [
        { role: "user", content: "Hello! What is the capital of Georgia?" },
      ],
      max_tokens: 256,
      temperature: 0.2,
      pipelineSlug: GENTRACE_PIPELINE_SLUG,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
  },
};
