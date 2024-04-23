import Movie from "./movie";
import { modelCall } from "./helpers";

async function movieQuery(movie: Movie, question: string) {
  const summary = await modelCall(
    "Summarize the movie",
    "openai.chat.completions.create",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Summarize the movie into a paragraph.",
        },
        {
          role: "user",
          content: `Title: {{title}}
Genre: {{genre}}
Year: {{year}}
Director: {{director}}
Actors: {{actors}}`,
        },
      ],
      temperature: 0,
    }, // args template
    movie, // template data
  );

  const answer = await modelCall(
    "Answer the question",
    "openai.chat.completions.create",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Answer the question based on the movie summary.",
        },
        {
          role: "user",
          content: `Movie Summary: {{summary}}
Question: {{question}}`,
        },
      ],
      temperature: 0,
    }, // args template
    { summary, question }, // template data
  );

  return { answer };
}

export default movieQuery;
