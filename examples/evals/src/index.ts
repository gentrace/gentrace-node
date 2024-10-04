import { evals } from "@gentrace/evals";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function runEvaluation() {
  try {
    const result = await evals.llm.base({
      name: "Content Quality Evaluation",
      prompt: `Evaluate the following text for its quality and coherence:

"Artificial intelligence (AI) is revolutionizing various industries, from healthcare to finance. Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. Natural language processing enables computers to understand and generate human-like text. As AI continues to advance, it raises important ethical considerations and discussions about its impact on society and the workforce."

Please provide a score and reasoning for your evaluation. Consider factors such as clarity, coherence, and informativeness. Rate the text as one of the following: Poor, Fair, Good, or Excellent.`,
      scoreAs: {
        Poor: 0,
        Fair: 0.33,
        Good: 0.67,
        Excellent: 1,
      },
    });

    console.log("Evaluation Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running evaluation:", error);
  }
}

runEvaluation();
