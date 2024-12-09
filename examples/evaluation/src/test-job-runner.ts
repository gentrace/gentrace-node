import {
  defineInteraction,
  enumParameter,
  init,
  listen,
  numericParameter,
  templateParameter,
} from "@gentrace/core";
import OpenAI from "openai";
import { z } from "zod";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY ?? "",
});

const writeEmailPromptParameter = templateParameter({
  name: "Write email prompt",
  defaultValue:
    "Write an email to {{toEmail}} from ({{fromName}}) {{fromEmail}} according to these instructions: {{instructions}}",
  variables: [
    { name: "fromName", example: "John Doe" },
    { name: "fromEmail", example: "john.doe@gmail.com" },
    { name: "toEmail", example: "blah@gmail.com" },
    {
      name: "instructions",
      example: { subject: "Hello", body: "Write a short email" },
    },
  ],
});

const writeEmail = defineInteraction({
  name: "Write email",
  fn: async ({ fromName, fromEmail, toEmail, instructions }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: writeEmailPromptParameter.render({
            fromName,
            fromEmail,
            toEmail,
            instructions,
          }),
        },
      ],
    });
    return {
      body: completion.choices[0].message.content,
    };
  },
  parameters: [writeEmailPromptParameter],
  inputType: z.object({
    fromName: z.string(),
    fromEmail: z.string().email(),
    toEmail: z.string().email(),
    instructions: z.string(),
  }),
});

const draftReply = defineInteraction({
  name: "Draft reply",
  fn: async ({ blah }) => {
    return {
      reply: "blah",
    };
  },
});

const randomYearParameter = numericParameter({
  name: "Random component of year",
  defaultValue: 3,
});

const guessTheYear = defineInteraction({
  name: "Guess the year",
  fn: async ({ query }) => {
    return Math.floor(Math.random() * randomYearParameter.getValue()) + 2022;
  },
  inputType: z.object({
    query: z.string(),
  }),
  parameters: [randomYearParameter],
});

const modelParameter = enumParameter({
  name: "AI Model",
  defaultValue: "GPT-4o",
  options: ["GPT-4o", "GPT-4o-mini", "claude-3.5-sonnet", "gemini-1.5-pro-002"],
});

const chooseModel = defineInteraction({
  name: "Choose model",
  fn: async ({ query }) => {
    return `I will use the model ${modelParameter.getValue()}.`;
  },
  inputType: z.object({
    query: z.string(),
  }),
  parameters: [modelParameter],
});

// Open a websocket connection to the Gentrace server
listen();
