import {
  LocalEvaluation,
  LocalEvaluationDebug,
  LocalEvaluationDebugError,
} from "@gentrace/core";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const DEFAULT_MODEL = "gpt-4o";

interface EvalOptions {
  name: string;
  prompt: string;
  scoreAs: Record<string, number> | "percentage";
}

export namespace evals {
  export namespace llm {
    export async function base(options: EvalOptions): Promise<LocalEvaluation> {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const scoreSchema =
        options.scoreAs === "percentage"
          ? z.number().min(0).max(100)
          : z.enum(Object.keys(options.scoreAs) as [string, ...string[]]);

      const EvalResponse = z.object({
        reasoning: z.string(),
        score: scoreSchema,
      });

      type EvalResponseType = z.infer<typeof EvalResponse>;

      let parsedResponse: EvalResponseType | null = null;
      let error: LocalEvaluationDebugError | null = null;

      try {
        const completion = await openai.beta.chat.completions.parse({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: "system" as const,
              content:
                "You are a helpful assistant that evaluates content based on given criteria.",
            },
            { role: "user" as const, content: options.prompt },
          ],
          response_format: zodResponseFormat(
            EvalResponse,
            "provide_evaluation",
          ),
        });

        const message = completion.choices[0]?.message;
        if (!message) {
          throw new Error("No message returned from the API");
        }
        if (!message.parsed) {
          const refusal = message.refusal || "Unknown refusal reason";
          throw new Error(
            `OpenAI failed to create a structured response: ${refusal}`,
          );
        }

        parsedResponse = message.parsed as EvalResponseType;
      } catch (err) {
        error = {
          message: err instanceof Error ? err.message : String(err),
        };
      }

      let value: number | null = null;
      if (parsedResponse) {
        if (options.scoreAs === "percentage") {
          value = (parsedResponse.score as number) / 100;
        } else {
          value =
            options.scoreAs[
              parsedResponse.score as keyof typeof options.scoreAs
            ];
        }
      }

      const debug: LocalEvaluationDebug = {
        resolvedPrompt: options.prompt,
        response: parsedResponse ? JSON.stringify(parsedResponse) : undefined,
        finalClassification: parsedResponse?.score.toString(),
        processorLogs: [],
        logs: [],
        error: error,
      };

      return {
        name: options.name,
        value: value !== null ? value : 0, // Default to 0 if there was an error
        label:
          options.scoreAs === "percentage"
            ? null
            : (parsedResponse?.score?.toString() ?? null),
        debug: debug,
      };
    }
  }
}
