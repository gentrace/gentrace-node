import { init, Pipeline } from "@gentrace/core";
import openaiPlugin from "@gentrace/openai";

async function createChatCompletion() {
  init({
    apiKey: process.env.GENTRACE_API_KEY ?? "",
    basePath: "http://localhost:3000/api/v1",
    plugins: [openaiPlugin],
  });

  const pipeline = new Pipeline({
    slug: "testing-pipeline-id",
    openAIConfig: {
      apiKey: process.env.OPENAI_KEY,
    },
  });

  await pipeline.setup();

  const runner = pipeline.start();

  const openAi = await runner.openai()

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();

import { init, Pipeline } from "@gentrace/core";
import { OpenAIApi, initPlugin, getPlugin } from "@gentrace/openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  
  basePath: "http://localhost:3000/api/v1",
  plugins: [initPlugin({
    ...creds
  })],
});


const pipeline = new Pipeline({
  slug: "testing-pipeline-id"
});

await pipeline.setup();

async function createChatCompletionA() {

  const runner = pipeline.start();

  const openAi = getPlugin(runner);

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();

import { init, Pipeline } from "@gentrace/core";
import tracePinecone from "@gentrace/pinecone";
import { withTracing, attachRuner } from "@gentrace/openai";
import OpenAIApi from 'openai';
import PineconeClient from 'pinecone'

const openai = withTracing(new OpenAIApi({ ... }))

const pinecone = new PineconeClient();
await pinecone.init();
init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const pipeline = new Pipeline({
  slug: "testing-pipeline-id",
});

async function createChatCompletion2() {
  const runner = pipeline.start();

  const openAi = attachRunner(openai, runner);
  const pinecone = attachPinecone(pinecone, runner);

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();

import { init, Pipeline } from "@gentrace/core";
import tracePinecone from "@gentrace/pinecone";
import { OpenAIApi, attachRunner } from "@gentrace/openai";
import PineconeClient from 'pinecone'

const openai = new OpenAIApi({ ... })

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api/v1",
});

const pipeline = new Pipeline({
  slug: "testing-pipeline-id",
});

async function createChatCompletion3() {
  const runner = pipeline.start();

  const openAi = attachOpenAi(runner, openai);
  const pinecone = attachPinecone(pinecone, runner);

  const chatCompletionResponse = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  for await (const message of chatCompletionResponse) {
    console.log("Message", message.choices[0]);
  }

  const chatCompletionResponseTwo = await openAi.chat.completions.create({
    messages: [{ role: "user", content: "Hello!" }],
    model: "gpt-3.5-turbo",
  });

  console.log("chatCompletionResponse", chatCompletionResponse);

  const pipelineRunId = await runner.submit();

  console.log("Pipeline run id", pipelineRunId);
}

createChatCompletion();
