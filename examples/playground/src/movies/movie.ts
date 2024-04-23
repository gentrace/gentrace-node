type Movie = {
  rank: number;
  title: string;
  genre: string;
  description: string;
  director: string;
  actors: string;
  year: number;
  runtime_minutes: number;
  rating: number;
  votes: number;
  revenue_millions: number | null;
  metascore: number | null;
};

export default Movie;

const allMovies: Movie[] = [
  {
    rank: 1,
    title: "Guardians of the Galaxy",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "A group of intergalactic criminals are forced to work together to stop a fanatical warrior from taking control of the universe.",
    director: "James Gunn",
    actors: "Chris Pratt, Vin Diesel, Bradley Cooper, Zoe Saldana",
    year: 2014,
    runtime_minutes: 121,
    rating: 8.1,
    votes: 757074,
    revenue_millions: 333.13,
    metascore: 76.0,
  },
  {
    rank: 2,
    title: "Prometheus",
    genre: "Adventure,Mystery,Sci-Fi",
    description:
      "Following clues to the origin of mankind, a team finds a structure on a distant moon, but they soon realize they are not alone.",
    director: "Ridley Scott",
    actors:
      "Noomi Rapace, Logan Marshall-Green, Michael Fassbender, Charlize Theron",
    year: 2012,
    runtime_minutes: 124,
    rating: 7.0,
    votes: 485820,
    revenue_millions: 126.46,
    metascore: 65.0,
  },
  {
    rank: 3,
    title: "Split",
    genre: "Horror,Thriller",
    description:
      "Three girls are kidnapped by a man with a diagnosed 23 distinct personalities. They must try to escape before the apparent emergence of a frightful new 24th.",
    director: "M. Night Shyamalan",
    actors: "James McAvoy, Anya Taylor-Joy, Haley Lu Richardson, Jessica Sula",
    year: 2016,
    runtime_minutes: 117,
    rating: 7.3,
    votes: 157606,
    revenue_millions: 138.12,
    metascore: 62.0,
  },
  {
    rank: 4,
    title: "Sing",
    genre: "Animation,Comedy,Family",
    description:
      "In a city of humanoid animals, a hustling theater impresario's attempt to save his theater with a singing competition becomes grander than he anticipates even as its finalists' find that their lives will never be the same.",
    director: "Christophe Lourdelet",
    actors:
      "Matthew McConaughey,Reese Witherspoon, Seth MacFarlane, Scarlett Johansson",
    year: 2016,
    runtime_minutes: 108,
    rating: 7.2,
    votes: 60545,
    revenue_millions: 270.32,
    metascore: 59.0,
  },
  {
    rank: 5,
    title: "Suicide Squad",
    genre: "Action,Adventure,Fantasy",
    description:
      "A secret government agency recruits some of the most dangerous incarcerated super-villains to form a defensive task force. Their first mission: save the world from the apocalypse.",
    director: "David Ayer",
    actors: "Will Smith, Jared Leto, Margot Robbie, Viola Davis",
    year: 2016,
    runtime_minutes: 123,
    rating: 6.2,
    votes: 393727,
    revenue_millions: 325.02,
    metascore: 40.0,
  },
  {
    rank: 6,
    title: "The Great Wall",
    genre: "Action,Adventure,Fantasy",
    description:
      "European mercenaries searching for black powder become embroiled in the defense of the Great Wall of China against a horde of monstrous creatures.",
    director: "Yimou Zhang",
    actors: "Matt Damon, Tian Jing, Willem Dafoe, Andy Lau",
    year: 2016,
    runtime_minutes: 103,
    rating: 6.1,
    votes: 56036,
    revenue_millions: 45.13,
    metascore: 42.0,
  },
  {
    rank: 7,
    title: "La La Land",
    genre: "Comedy,Drama,Music",
    description: "A jazz pianist falls for an aspiring actress in Los Angeles.",
    director: "Damien Chazelle",
    actors: "Ryan Gosling, Emma Stone, Rosemarie DeWitt, J.K. Simmons",
    year: 2016,
    runtime_minutes: 128,
    rating: 8.3,
    votes: 258682,
    revenue_millions: 151.06,
    metascore: 93.0,
  },
  {
    rank: 8,
    title: "Mindhorn",
    genre: "Comedy",
    description:
      'A has-been actor best known for playing the title character in the 1980s detective series "Mindhorn" must work with the police when a serial killer says that he will only speak with Detective Mindhorn, whom he believes to be a real person.',
    director: "Sean Foley",
    actors: "Essie Davis, Andrea Riseborough, Julian Barratt,Kenneth Branagh",
    year: 2016,
    runtime_minutes: 89,
    rating: 6.4,
    votes: 2490,
    revenue_millions: null,
    metascore: 71.0,
  },
  {
    rank: 9,
    title: "The Lost City of Z",
    genre: "Action,Adventure,Biography",
    description:
      "A true-life drama, centering on British explorer Col. Percival Fawcett, who disappeared while searching for a mysterious city in the Amazon in the 1920s.",
    director: "James Gray",
    actors: "Charlie Hunnam, Robert Pattinson, Sienna Miller, Tom Holland",
    year: 2016,
    runtime_minutes: 141,
    rating: 7.1,
    votes: 7188,
    revenue_millions: 8.01,
    metascore: 78.0,
  },
  {
    rank: 10,
    title: "Passengers",
    genre: "Adventure,Drama,Romance",
    description:
      "A spacecraft traveling to a distant colony planet and transporting thousands of people has a malfunction in its sleep chambers. As a result, two passengers are awakened 90 years early.",
    director: "Morten Tyldum",
    actors: "Jennifer Lawrence, Chris Pratt, Michael Sheen,Laurence Fishburne",
    year: 2016,
    runtime_minutes: 116,
    rating: 7.0,
    votes: 192177,
    revenue_millions: 100.01,
    metascore: 41.0,
  },
  {
    rank: 11,
    title: "Fantastic Beasts and Where to Find Them",
    genre: "Adventure,Family,Fantasy",
    description:
      "The adventures of writer Newt Scamander in New York's secret community of witches and wizards seventy years before Harry Potter reads his book in school.",
    director: "David Yates",
    actors: "Eddie Redmayne, Katherine Waterston, Alison Sudol,Dan Fogler",
    year: 2016,
    runtime_minutes: 133,
    rating: 7.5,
    votes: 232072,
    revenue_millions: 234.02,
    metascore: 66.0,
  },
  {
    rank: 12,
    title: "Hidden Figures",
    genre: "Biography,Drama,History",
    description:
      "The story of a team of female African-American mathematicians who served a vital role in NASA during the early years of the U.S. space program.",
    director: "Theodore Melfi",
    actors: "Taraji P. Henson, Octavia Spencer, Janelle Monáe,Kevin Costner",
    year: 2016,
    runtime_minutes: 127,
    rating: 7.8,
    votes: 93103,
    revenue_millions: 169.27,
    metascore: 74.0,
  },
  {
    rank: 13,
    title: "Rogue One",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "The Rebel Alliance makes a risky move to steal the plans for the Death Star, setting up the epic saga to follow.",
    director: "Gareth Edwards",
    actors: "Felicity Jones, Diego Luna, Alan Tudyk, Donnie Yen",
    year: 2016,
    runtime_minutes: 133,
    rating: 7.9,
    votes: 323118,
    revenue_millions: 532.17,
    metascore: 65.0,
  },
  {
    rank: 14,
    title: "Moana",
    genre: "Animation,Adventure,Comedy",
    description:
      "In Ancient Polynesia, when a terrible curse incurred by the Demigod Maui reaches an impetuous Chieftain's daughter's island, she answers the Ocean's call to seek out the Demigod to set things right.",
    director: "Ron Clements",
    actors: "Auli'i Cravalho, Dwayne Johnson, Rachel House, Temuera Morrison",
    year: 2016,
    runtime_minutes: 107,
    rating: 7.7,
    votes: 118151,
    revenue_millions: 248.75,
    metascore: 81.0,
  },
  {
    rank: 15,
    title: "Colossal",
    genre: "Action,Comedy,Drama",
    description:
      "Gloria is an out-of-work party girl forced to leave her life in New York City, and move back home. When reports surface that a giant creature is destroying Seoul, she gradually comes to the realization that she is somehow connected to this phenomenon.",
    director: "Nacho Vigalondo",
    actors: "Anne Hathaway, Jason Sudeikis, Austin Stowell,Tim Blake Nelson",
    year: 2016,
    runtime_minutes: 109,
    rating: 6.4,
    votes: 8612,
    revenue_millions: 2.87,
    metascore: 70.0,
  },
  {
    rank: 16,
    title: "The Secret Life of Pets",
    genre: "Animation,Adventure,Comedy",
    description:
      "The quiet life of a terrier named Max is upended when his owner takes in Duke, a stray whom Max instantly dislikes.",
    director: "Chris Renaud",
    actors: "Louis C.K., Eric Stonestreet, Kevin Hart, Lake Bell",
    year: 2016,
    runtime_minutes: 87,
    rating: 6.6,
    votes: 120259,
    revenue_millions: 368.31,
    metascore: 61.0,
  },
  {
    rank: 17,
    title: "Hacksaw Ridge",
    genre: "Biography,Drama,History",
    description:
      "WWII American Army Medic Desmond T. Doss, who served during the Battle of Okinawa, refuses to kill people, and becomes the first man in American history to receive the Medal of Honor without firing a shot.",
    director: "Mel Gibson",
    actors: "Andrew Garfield, Sam Worthington, Luke Bracey,Teresa Palmer",
    year: 2016,
    runtime_minutes: 139,
    rating: 8.2,
    votes: 211760,
    revenue_millions: 67.12,
    metascore: 71.0,
  },
  {
    rank: 18,
    title: "Jason Bourne",
    genre: "Action,Thriller",
    description:
      "The CIA's most dangerous former operative is drawn out of hiding to uncover more explosive truths about his past.",
    director: "Paul Greengrass",
    actors: "Matt Damon, Tommy Lee Jones, Alicia Vikander,Vincent Cassel",
    year: 2016,
    runtime_minutes: 123,
    rating: 6.7,
    votes: 150823,
    revenue_millions: 162.16,
    metascore: 58.0,
  },
  {
    rank: 19,
    title: "Lion",
    genre: "Biography,Drama",
    description:
      "A five-year-old Indian boy gets lost on the streets of Calcutta, thousands of kilometers from home. He survives many challenges before being adopted by a couple in Australia. 25 years later, he sets out to find his lost family.",
    director: "Garth Davis",
    actors: "Dev Patel, Nicole Kidman, Rooney Mara, Sunny Pawar",
    year: 2016,
    runtime_minutes: 118,
    rating: 8.1,
    votes: 102061,
    revenue_millions: 51.69,
    metascore: 69.0,
  },
  {
    rank: 20,
    title: "Arrival",
    genre: "Drama,Mystery,Sci-Fi",
    description:
      "When twelve mysterious spacecraft appear around the world, linguistics professor Louise Banks is tasked with interpreting the language of the apparent alien visitors.",
    director: "Denis Villeneuve",
    actors: "Amy Adams, Jeremy Renner, Forest Whitaker,Michael Stuhlbarg",
    year: 2016,
    runtime_minutes: 116,
    rating: 8.0,
    votes: 340798,
    revenue_millions: 100.5,
    metascore: 81.0,
  },
  {
    rank: 21,
    title: "Gold",
    genre: "Adventure,Drama,Thriller",
    description:
      "Kenny Wells, a prospector desperate for a lucky break, teams up with a similarly eager geologist and sets off on a journey to find gold in the uncharted jungle of Indonesia.",
    director: "Stephen Gaghan",
    actors:
      "Matthew McConaughey, Edgar Ramírez, Bryce Dallas Howard, Corey Stoll",
    year: 2016,
    runtime_minutes: 120,
    rating: 6.7,
    votes: 19053,
    revenue_millions: 7.22,
    metascore: 49.0,
  },
  {
    rank: 22,
    title: "Manchester by the Sea",
    genre: "Drama",
    description:
      "A depressed uncle is asked to take care of his teenage nephew after the boy's father dies.",
    director: "Kenneth Lonergan",
    actors: "Casey Affleck, Michelle Williams, Kyle Chandler,Lucas Hedges",
    year: 2016,
    runtime_minutes: 137,
    rating: 7.9,
    votes: 134213,
    revenue_millions: 47.7,
    metascore: 96.0,
  },
  {
    rank: 23,
    title: "Hounds of Love",
    genre: "Crime,Drama,Horror",
    description:
      "A cold-blooded predatory couple while cruising the streets in search of their next victim, will stumble upon a 17-year-old high school girl, who will be sedated, abducted and chained in the strangers' guest room.",
    director: "Ben Young",
    actors: "Emma Booth, Ashleigh Cummings, Stephen Curry,Susie Porter",
    year: 2016,
    runtime_minutes: 108,
    rating: 6.7,
    votes: 1115,
    revenue_millions: null,
    metascore: 72.0,
  },
  {
    rank: 24,
    title: "Trolls",
    genre: "Animation,Adventure,Comedy",
    description:
      "After the Bergens invade Troll Village, Poppy, the happiest Troll ever born, and the curmudgeonly Branch set off on a journey to rescue her friends.",
    director: "Walt Dohrn",
    actors:
      "Anna Kendrick, Justin Timberlake,Zooey Deschanel, Christopher Mintz-Plasse",
    year: 2016,
    runtime_minutes: 92,
    rating: 6.5,
    votes: 38552,
    revenue_millions: 153.69,
    metascore: 56.0,
  },
  {
    rank: 25,
    title: "Independence Day: Resurgence",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "Two decades after the first Independence Day invasion, Earth is faced with a new extra-Solar threat. But will mankind's new space defenses be enough?",
    director: "Roland Emmerich",
    actors: "Liam Hemsworth, Jeff Goldblum, Bill Pullman,Maika Monroe",
    year: 2016,
    runtime_minutes: 120,
    rating: 5.3,
    votes: 127553,
    revenue_millions: 103.14,
    metascore: 32.0,
  },
  {
    rank: 26,
    title: "Paris pieds nus",
    genre: "Comedy",
    description:
      "Fiona visits Paris for the first time to assist her myopic Aunt Martha. Catastrophes ensue, mainly involving Dom, a homeless man who has yet to have an emotion or thought he was afraid of expressing.",
    director: "Dominique Abel",
    actors: "Fiona Gordon, Dominique Abel,Emmanuelle Riva, Pierre Richard",
    year: 2016,
    runtime_minutes: 83,
    rating: 6.8,
    votes: 222,
    revenue_millions: null,
    metascore: null,
  },
  {
    rank: 27,
    title: "Bahubali: The Beginning",
    genre: "Action,Adventure,Drama",
    description:
      "In ancient India, an adventurous and daring man becomes involved in a decades old feud between two warring people.",
    director: "S.S. Rajamouli",
    actors: "Prabhas, Rana Daggubati, Anushka Shetty,Tamannaah Bhatia",
    year: 2015,
    runtime_minutes: 159,
    rating: 8.3,
    votes: 76193,
    revenue_millions: 6.5,
    metascore: null,
  },
  {
    rank: 28,
    title: "Dead Awake",
    genre: "Horror,Thriller",
    description:
      "A young woman must save herself and her friends from an ancient evil that stalks its victims through the real-life phenomenon of sleep paralysis.",
    director: "Phillip Guzman",
    actors: "Jocelin Donahue, Jesse Bradford, Jesse Borrego,Lori Petty",
    year: 2016,
    runtime_minutes: 99,
    rating: 4.7,
    votes: 523,
    revenue_millions: 0.01,
    metascore: null,
  },
  {
    rank: 29,
    title: "Bad Moms",
    genre: "Comedy",
    description:
      "When three overworked and under-appreciated moms are pushed beyond their limits, they ditch their conventional responsibilities for a jolt of long overdue freedom, fun, and comedic self-indulgence.",
    director: "Jon Lucas",
    actors: "Mila Kunis, Kathryn Hahn, Kristen Bell,Christina Applegate",
    year: 2016,
    runtime_minutes: 100,
    rating: 6.2,
    votes: 66540,
    revenue_millions: 113.08,
    metascore: 60.0,
  },
  {
    rank: 30,
    title: "Assassin's Creed",
    genre: "Action,Adventure,Drama",
    description:
      "When Callum Lynch explores the memories of his ancestor Aguilar and gains the skills of a Master Assassin, he discovers he is a descendant of the secret Assassins society.",
    director: "Justin Kurzel",
    actors:
      "Michael Fassbender, Marion Cotillard, Jeremy Irons,Brendan Gleeson",
    year: 2016,
    runtime_minutes: 115,
    rating: 5.9,
    votes: 112813,
    revenue_millions: 54.65,
    metascore: 36.0,
  },
  {
    rank: 31,
    title: "Why Him?",
    genre: "Comedy",
    description:
      "A holiday gathering threatens to go off the rails when Ned Fleming realizes that his daughter's Silicon Valley millionaire boyfriend is about to pop the question.",
    director: "John Hamburg",
    actors: "Zoey Deutch, James Franco, Tangie Ambrose,Cedric the Entertainer",
    year: 2016,
    runtime_minutes: 111,
    rating: 6.3,
    votes: 48123,
    revenue_millions: 60.31,
    metascore: 39.0,
  },
  {
    rank: 32,
    title: "Nocturnal Animals",
    genre: "Drama,Thriller",
    description:
      "A wealthy art gallery owner is haunted by her ex-husband's novel, a violent thriller she interprets as a symbolic revenge tale.",
    director: "Tom Ford",
    actors: "Amy Adams, Jake Gyllenhaal, Michael Shannon, Aaron Taylor-Johnson",
    year: 2016,
    runtime_minutes: 116,
    rating: 7.5,
    votes: 126030,
    revenue_millions: 10.64,
    metascore: 67.0,
  },
  {
    rank: 33,
    title: "X-Men: Apocalypse",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "After the re-emergence of the world's first mutant, world-destroyer Apocalypse, the X-Men must unite to defeat his extinction level plan.",
    director: "Bryan Singer",
    actors:
      "James McAvoy, Michael Fassbender, Jennifer Lawrence, Nicholas Hoult",
    year: 2016,
    runtime_minutes: 144,
    rating: 7.1,
    votes: 275510,
    revenue_millions: 155.33,
    metascore: 52.0,
  },
  {
    rank: 34,
    title: "Deadpool",
    genre: "Action,Adventure,Comedy",
    description:
      "A fast-talking mercenary with a morbid sense of humor is subjected to a rogue experiment that leaves him with accelerated healing powers and a quest for revenge.",
    director: "Tim Miller",
    actors: "Ryan Reynolds, Morena Baccarin, T.J. Miller, Ed Skrein",
    year: 2016,
    runtime_minutes: 108,
    rating: 8.0,
    votes: 627797,
    revenue_millions: 363.02,
    metascore: 65.0,
  },
  {
    rank: 35,
    title: "Resident Evil: The Final Chapter",
    genre: "Action,Horror,Sci-Fi",
    description:
      "Alice returns to where the nightmare began: The Hive in Raccoon City, where the Umbrella Corporation is gathering its forces for a final strike against the only remaining survivors of the apocalypse.",
    director: "Paul W.S. Anderson",
    actors: "Milla Jovovich, Iain Glen, Ali Larter, Shawn Roberts",
    year: 2016,
    runtime_minutes: 107,
    rating: 5.6,
    votes: 46165,
    revenue_millions: 26.84,
    metascore: 49.0,
  },
  {
    rank: 36,
    title: "Captain America: Civil War",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "Political interference in the Avengers' activities causes a rift between former allies Captain America and Iron Man.",
    director: "Anthony Russo",
    actors: "Chris Evans, Robert Downey Jr.,Scarlett Johansson, Sebastian Stan",
    year: 2016,
    runtime_minutes: 147,
    rating: 7.9,
    votes: 411656,
    revenue_millions: 408.08,
    metascore: 75.0,
  },
  {
    rank: 37,
    title: "Interstellar",
    genre: "Adventure,Drama,Sci-Fi",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    director: "Christopher Nolan",
    actors:
      "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Mackenzie Foy",
    year: 2014,
    runtime_minutes: 169,
    rating: 8.6,
    votes: 1047747,
    revenue_millions: 187.99,
    metascore: 74.0,
  },
  {
    rank: 38,
    title: "Doctor Strange",
    genre: "Action,Adventure,Fantasy",
    description:
      "While on a journey of physical and spiritual healing, a brilliant neurosurgeon is drawn into the world of the mystic arts.",
    director: "Scott Derrickson",
    actors:
      "Benedict Cumberbatch, Chiwetel Ejiofor, Rachel McAdams, Benedict Wong",
    year: 2016,
    runtime_minutes: 115,
    rating: 7.6,
    votes: 293732,
    revenue_millions: 232.6,
    metascore: 72.0,
  },
  {
    rank: 39,
    title: "The Magnificent Seven",
    genre: "Action,Adventure,Western",
    description:
      "Seven gunmen in the old west gradually come together to help a poor village against savage thieves.",
    director: "Antoine Fuqua",
    actors: "Denzel Washington, Chris Pratt, Ethan Hawke,Vincent D'Onofrio",
    year: 2016,
    runtime_minutes: 132,
    rating: 6.9,
    votes: 122853,
    revenue_millions: 93.38,
    metascore: 54.0,
  },
  {
    rank: 40,
    title: "5- 25- 77",
    genre: "Comedy,Drama",
    description:
      "Alienated, hopeful-filmmaker Pat Johnson's epic story growing up in rural Illinois, falling in love, and becoming the first fan of the movie that changed everything.",
    director: "Patrick Read Johnson",
    actors: "John Francis Daley, Austin Pendleton, Colleen Camp, Neil Flynn",
    year: 2007,
    runtime_minutes: 113,
    rating: 7.1,
    votes: 241,
    revenue_millions: null,
    metascore: null,
  },
  {
    rank: 41,
    title: "Sausage Party",
    genre: "Animation,Adventure,Comedy",
    description: "A sausage strives to discover the truth about his existence.",
    director: "Greg Tiernull",
    actors: "Seth Rogen, Kristen Wiig, Jonah Hill, Alistair Abell",
    year: 2016,
    runtime_minutes: 89,
    rating: 6.3,
    votes: 120690,
    revenue_millions: 97.66,
    metascore: 66.0,
  },
  {
    rank: 42,
    title: "Moonlight",
    genre: "Drama",
    description:
      "A chronicle of the childhood, adolescence and burgeoning adulthood of a young, African-American, gay man growing up in a rough neighborhood of Miami.",
    director: "Barry Jenkins",
    actors: "Mahershala Ali, Shariff Earp, Duan Sanderson, Alex R. Hibbert",
    year: 2016,
    runtime_minutes: 111,
    rating: 7.5,
    votes: 135095,
    revenue_millions: 27.85,
    metascore: 99.0,
  },
  {
    rank: 43,
    title: "Don't Fuck in the Woods",
    genre: "Horror",
    description:
      "A group of friends are going on a camping trip to celebrate graduating college. But once they enter the woods, the proverbial shit starts to hit the fan.",
    director: "Shawn Burkett",
    actors: "Brittany Blanton, Ayse Howard, Roman Jossart,Nadia White",
    year: 2016,
    runtime_minutes: 73,
    rating: 2.7,
    votes: 496,
    revenue_millions: null,
    metascore: null,
  },
  {
    rank: 44,
    title: "The Founder",
    genre: "Biography,Drama,History",
    description:
      "The story of Ray Kroc, a salesman who turned two brothers' innovative fast food eatery, McDonald's, into one of the biggest restaurant businesses in the world with a combination of ambition, persistence, and ruthlessness.",
    director: "John Lee Hancock",
    actors:
      "Michael Keaton, Nick Offerman, John Carroll Lynch, Linda Cardellini",
    year: 2016,
    runtime_minutes: 115,
    rating: 7.2,
    votes: 37033,
    revenue_millions: 12.79,
    metascore: 66.0,
  },
  {
    rank: 45,
    title: "Lowriders",
    genre: "Drama",
    description:
      "A young street artist in East Los Angeles is caught between his father's obsession with lowrider car culture, his ex-felon brother and his need for self-expression.",
    director: "Ricardo de Montreuil",
    actors: "Gabriel Chavarria, Demián Bichir, Theo Rossi,Tony Revolori",
    year: 2016,
    runtime_minutes: 99,
    rating: 6.3,
    votes: 279,
    revenue_millions: 4.21,
    metascore: 57.0,
  },
  {
    rank: 46,
    title: "Pirates of the Caribbean: On Stranger Tides",
    genre: "Action,Adventure,Fantasy",
    description:
      "Jack Sparrow and Barbossa embark on a quest to find the elusive fountain of youth, only to discover that Blackbeard and his daughter are after it too.",
    director: "Rob Marshall",
    actors: "Johnny Depp, Penélope Cruz, Ian McShane, Geoffrey Rush",
    year: 2011,
    runtime_minutes: 136,
    rating: 6.7,
    votes: 395025,
    revenue_millions: 241.06,
    metascore: 45.0,
  },
  {
    rank: 47,
    title: "Miss Sloane",
    genre: "Drama,Thriller",
    description:
      "In the high-stakes world of political power-brokers, Elizabeth Sloane is the most sought after and formidable lobbyist in D.C. But when taking on the most powerful opponent of her career, she finds winning may come at too high a price.",
    director: "John Madden",
    actors: "Jessica Chastain, Mark Strong, Gugu Mbatha-Raw,Michael Stuhlbarg",
    year: 2016,
    runtime_minutes: 132,
    rating: 7.3,
    votes: 17818,
    revenue_millions: 3.44,
    metascore: 64.0,
  },
  {
    rank: 48,
    title: "Fallen",
    genre: "Adventure,Drama,Fantasy",
    description:
      "A young girl finds herself in a reform school after therapy since she was blamed for the death of a young boy. At the school she finds herself drawn to a fellow student, unaware that he is an angel, and has loved her for thousands of years.",
    director: "Scott Hicks",
    actors: "Hermione Corfield, Addison Timlin, Joely Richardson,Jeremy Irvine",
    year: 2016,
    runtime_minutes: 91,
    rating: 5.6,
    votes: 5103,
    revenue_millions: null,
    metascore: null,
  },
  {
    rank: 49,
    title: "Star Trek Beyond",
    genre: "Action,Adventure,Sci-Fi",
    description:
      "The USS Enterprise crew explores the furthest reaches of uncharted space, where they encounter a new ruthless enemy who puts them and everything the Federation stands for to the test.",
    director: "Justin Lin",
    actors: "Chris Pine, Zachary Quinto, Karl Urban, Zoe Saldana",
    year: 2016,
    runtime_minutes: 122,
    rating: 7.1,
    votes: 164567,
    revenue_millions: 158.8,
    metascore: 68.0,
  },
  {
    rank: 50,
    title: "The Last Face",
    genre: "Drama",
    description:
      "A director (Charlize Theron) of an international aid agency in Africa meets a relief aid doctor (Javier Bardem) amidst a political/social revolution, and together face tough choices ... See full summary »",
    director: "Sean Penn",
    actors: "Charlize Theron, Javier Bardem, Adèle Exarchopoulos,Jared Harris",
    year: 2016,
    runtime_minutes: 130,
    rating: 3.7,
    votes: 987,
    revenue_millions: null,
    metascore: 16.0,
  },
];

export { allMovies };
