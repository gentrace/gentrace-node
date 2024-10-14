import { init } from "@gentrace/core";
import { OpenAI } from "@gentrace/openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const Step = z.object({
  explanation: z.string(),
  output: z.string(),
});

const MathReasoning = z.object({
  steps: z.array(Step),
  final_answer: z.string(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

async function createStructuredCompletion() {
  console.log("❤️ Intermediary namespaces:", {
    openai: openai,
    beta: openai.beta,
    chat: openai.beta?.chat,
    completions: openai.beta?.chat?.completions,
    parse: openai.beta?.chat?.completions?.parse,
  });
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful math tutor. Guide the user through the solution step by step.",
      },
      { role: "user", content: "how can I solve 8x + 7 = -23" },
    ],
    response_format: zodResponseFormat(MathReasoning, "math_reasoning"),
    gentrace: {
      metadata: {
        problemType: {
          type: "string",
          value: "linear_equation",
        },
      },
    },
  });

  console.log("Parsed math reasoning result:", completion.choices[0].message);
}

createStructuredCompletion();
