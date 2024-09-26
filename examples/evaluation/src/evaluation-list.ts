import { getEvaluations, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
});

const resultId = "d07116fd-af08-4b0b-a33a-f487bb77b884";

async function getEvaluationsExample() {
  try {
    const evaluations = await getEvaluations({
      resultId,
    });

    console.log("[EVAL_LOG] Evaluations length:", evaluations.length);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
  }
}

getEvaluationsExample();
