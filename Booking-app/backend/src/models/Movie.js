const mongoose = require("mongoose");

const movieSchema =
new mongoose.Schema({

  title: String,

  language: String,

  duration: String,

  image: String,

  description: String,

  theatre: String,

  genre: String,

  cast: String,

  director: String,

  releaseDate: String,

  rating: String,

  hero: String,

  certificate: String,

  format: {
    type: String,
    default: "2D",
  },

  trailerUrl: String,

  interestCount: {
    type: String,
    default: "",
  },

  aboutMovie: String,

  isOfferApplicable: {
    type: Boolean,
    default: false,
  },

  offers: [
    {
      title: String,
      description: String,
    },
  ],

  castMembers: [
    {
      name: String,
      role: String,
      photo: String,
    },
  ],

  crewMembers: [
    {
      name: String,
      role: String,
      photo: String,
    },
  ],

});

module.exports =
mongoose.model(
  "Movie",
  movieSchema
);
