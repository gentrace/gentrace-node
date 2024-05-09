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
    [
      { name: "movie", type: "Movie" },
      { name: "question", type: "string" },
      { name: "sample_answer", type: "string" },
    ], // input fields
    [{ name: "answer", type: "string" }], // output fields
    (inputs: { movie: Movie; question: string }) =>
      movieQuery(inputs.movie, inputs.question), // interaction
  );

  gentrace.start();
}

playground();
