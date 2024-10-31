import { defineInteraction, init, listen } from "@gentrace/core";
import { z } from "zod";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

let i = 0;
const writeEmail = defineInteraction({
  name: "Write email",
  fn: async ({ fromName, fromEmail, toEmail, instructions }) => {
    await new Promise((resolve) =>
      setTimeout(resolve, 10 * (1 + Math.random())),
    );
    i += 1;
    if (i % 3 === 0) {
      throw new Error("Failed to write email");
    }
    return {
      from: fromEmail,
      to: toEmail,
      subject: `Email from ${fromName}`,
      body: instructions,
    };
  },
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

listen();
