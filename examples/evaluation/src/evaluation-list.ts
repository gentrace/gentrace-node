import { getEvaluations, init } from "@gentrace/core";

init({
  apiKey: process.env.GENTRACE_API_KEY ?? "",
  basePath: "http://localhost:3000/api",
});

async function getEvaluationsExample() {
  try {
    const evaluations = await getEvaluations({
      resultId: "0c58eeaf-f947-5de8-bebd-217d25795108",
    });

    console.log("Evaluations:", evaluations);

    if (evaluations.length > 0) {
      console.log("First evaluation details:");
      console.log("ID:", evaluations[0].id);
      console.log("Created At:", evaluations[0].createdAt);
      console.log("Updated At:", evaluations[0].updatedAt);
      // Add more fields as needed
    } else {
      console.log("No evaluations found for the given result ID.");
    }
  } catch (error) {
    console.error("Error fetching evaluations:", error);
  }
}

getEvaluationsExample();
