import { getEvaluations, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

const resultId = "2ebae81f-46f8-53a5-a6a9-82066229ce75";

async function getEvaluationsExample() {
  try {
    const evaluations = await getEvaluations({
      resultId,
    });

    console.log("[EVAL_LOG] Evaluations length:", evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
  }
}

getEvaluationsExample();
