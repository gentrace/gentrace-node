import {
  defineInteraction,
  init,
  handleWebhook,
  numericParameter,
  templateParameter,
} from "@gentrace/core";
import OpenAI from "openai";
import { z } from "zod";
import express from "express";
import { createHmac } from "crypto";

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

// Create Express app
const app = express();

// Verify the signature of the request
app.use(
  express.json({
    verify: (req: any, res: express.Response, buf, next) => {
      req.rawBody = buf;
      const webhookSecret = process.env.GENTRACE_WEBHOOK_SECRET ?? "";

      // Get the signature from the header
      const signature = req.header("x-gentrace-signature");

      if (!signature) {
        throw new Error("No signature provided");
      }

      const calculatedSignature = `sha256=${createHmac("sha256", webhookSecret)
        .update(req.rawBody)
        .digest("hex")}`;

      // Verify the signature
      if (signature !== calculatedSignature) {
        throw new Error("Invalid signature");
      }
    },
  }),
);

// Add error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    res.status(401).send("Unauthorized");
  },
);

// Add webhook endpoint
app.post("/", async (req: express.Request, res: express.Response) => {
  // Get the body of the request as a JSON object
  const body = req.body;
  await handleWebhook(body, (responseBody) => {
    res.status(200).json(responseBody);
  });
});

// Start the server
const PORT = process.env.PORT || 443;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
