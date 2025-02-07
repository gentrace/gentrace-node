import { init, Pipeline } from "@gentrace/core";
import { initPlugin } from "@gentrace/openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

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

async function createStructuredCompletion() {
  const plugin = await initPlugin({
    apiKey: process.env.OPENAI_KEY ?? "",
  });

  const pipeline = new Pipeline({
    slug: "math-reasoning-pipeline",
    plugins: {
      openai: plugin,
    },
  });

  const runner = pipeline.start();

  console.log("runner.openai.beta", runner.openai.beta);

  console.log(
    "runner.openai.beta.chat.completions",
    runner.openai.beta.chat.completions,
  );

  const completion = await runner.openai.beta.chat.completions.parse({
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

  console.log("Parsed math reasoning result", completion.choices[0].message);

  await runner.submit({ waitForServer: true });
}

createStructuredCompletion();
