import Movie, { allMovies } from "./movie";
import movieQuery from "./movie-query";

import { gentrace } from "./helpers";

async function playground() {
  gentrace.registerCustomType("Movie");

  allMovies.forEach((movie) => {
    gentrace.registerCustomObject("Movie", movie.title, movie);
  });

  gentrace.registerInteraction(
    "Movie Query", // interaction name
    {
      movie: "Movie",
      question: "string",
      sample_answer: "string",
    }, // input fields
    {
      answer: "string",
    }, // output fields
    (inputs: { movie: Movie; question: string }) =>
      movieQuery(inputs.movie, inputs.question), // interation
  );

  gentrace.start();
}

playground();
