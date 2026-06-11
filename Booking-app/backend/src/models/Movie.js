const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Movie", movieSchema);