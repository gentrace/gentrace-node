import { init, GentraceSession } from "@gentrace/playground";
import * as Mustache from "mustache";

import OpenAI from "openai";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  runName: "Example run for Playground SDK",
  basePath: process.env.GENTRACE_BASE_PATH ?? "",
});

const gentrace = new GentraceSession();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY ?? "",
});

async function modelCall(
  stepName: string,
  method: string,
  argsTemplate: Record<string, any>,
  templateData: Record<string, any>,
): Promise<string> {
  if (method !== "openai.chat.completions.create") {
    throw new Error("Method " + method + " is not supported.");
  }

  const { overrideArgsTemplate, stepRunId, cachedResponse } =
    gentrace.getStepRun(stepName, method, argsTemplate, templateData);

  if (cachedResponse && cachedResponse.length > 0) {
    gentrace.submitStepRun(stepRunId, cachedResponse);
    return cachedResponse;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: overrideArgsTemplate.model, // gpt-3.5-turbo, gpt-4, etc.
      messages: JSON.parse(
        Mustache.render(
          JSON.stringify(overrideArgsTemplate.messages),
          templateData,
        ),
      ),
      temperature: overrideArgsTemplate.temperature,
    });

    const response = completion.choices[0].message.content || "";
    gentrace.submitStepRun(stepRunId, response);
    console.log({ response });
    return response;
  } catch (error) {
    console.error("Error:", error);
  }
  return "";
}

export { modelCall, gentrace };
